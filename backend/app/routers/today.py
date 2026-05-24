"""Today's IPL match for the logged-in user's favorite team.

Architecture: a small adapter pattern so we can swap data sources.
- If CRICAPI_KEY is set in .env, hit cricapi.com's IPL series endpoint.
- Otherwise, return mock data so you can develop without burning quota.

The frontend doesn't care which source it came from — same shape either way.
"""

from datetime import date, datetime
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.auth import User
from app.models.cricket import Team
from app.routers.auth import current_user

router = APIRouter()

MatchStatus = Literal["upcoming", "live", "won", "lost", "tied", "no_match"]


class TodayMatch(BaseModel):
    status: MatchStatus
    user_team_id: str
    user_team_name: str
    opponent_team_id: str | None = None
    opponent_team_name: str | None = None
    venue: str | None = None
    start_time: str | None = None        # ISO datetime
    user_team_score: str | None = None   # "187/4 (20)"
    opponent_score: str | None = None
    result_summary: str | None = None    # "won by 5 wickets"
    message: str                         # Friendly headline for the UI


# ----- mock data source -----------------------------------------------------

def _mock_today(user_team: Team) -> TodayMatch:
    """Realistic-looking mock data so the UI works without a CricAPI key.

    Rotates through 5 scenarios based on the day-of-year, so you see all
    the different result screens as days pass — useful for demos.
    """
    today = date.today()
    bucket = today.toordinal() % 5

    if bucket == 0:
        return TodayMatch(
            status="no_match",
            user_team_id=user_team.id,
            user_team_name=user_team.name,
            message=f"No match for {user_team.name} today. Next up: tomorrow.",
        )
    if bucket == 1:
        return TodayMatch(
            status="upcoming",
            user_team_id=user_team.id,
            user_team_name=user_team.name,
            opponent_team_id="rcb" if user_team.id != "rcb" else "csk",
            opponent_team_name="Royal Challengers Bengaluru" if user_team.id != "rcb" else "Chennai Super Kings",
            venue="M. A. Chidambaram Stadium",
            start_time=datetime.combine(today, datetime.min.time()).replace(hour=19, minute=30).isoformat(),
            message=f"{user_team.name} play tonight at 7:30 PM.",
        )
    if bucket == 2:
        return TodayMatch(
            status="live",
            user_team_id=user_team.id,
            user_team_name=user_team.name,
            opponent_team_id="mi" if user_team.id != "mi" else "csk",
            opponent_team_name="Mumbai Indians" if user_team.id != "mi" else "Chennai Super Kings",
            venue="Wankhede Stadium",
            user_team_score="142/3 (15.2)",
            opponent_score="—",
            message=f"{user_team.name} batting now — chase is on!",
        )
    if bucket == 3:
        return TodayMatch(
            status="won",
            user_team_id=user_team.id,
            user_team_name=user_team.name,
            opponent_team_id="kkr" if user_team.id != "kkr" else "csk",
            opponent_team_name="Kolkata Knight Riders" if user_team.id != "kkr" else "Chennai Super Kings",
            venue="Eden Gardens",
            user_team_score="201/5 (20)",
            opponent_score="178/9 (20)",
            result_summary="won by 23 runs",
            message=f"{user_team.name} WIN! 🎉",
        )
    return TodayMatch(
        status="lost",
        user_team_id=user_team.id,
        user_team_name=user_team.name,
        opponent_team_id="srh" if user_team.id != "srh" else "csk",
        opponent_team_name="Sunrisers Hyderabad" if user_team.id != "srh" else "Chennai Super Kings",
        venue="Rajiv Gandhi International Stadium",
        user_team_score="167/8 (20)",
        opponent_score="170/4 (18.4)",
        result_summary="lost by 6 wickets",
        message=f"{user_team.name} fell short today. Well played.",
    )


# ----- CricAPI data source --------------------------------------------------

async def _fetch_from_cricapi(user_team: Team) -> TodayMatch | None:
    """Query cricapi.com for today's IPL matches and find one with our team.

    Returns None on any error or no-match-found, so the caller can fall
    back to mock data gracefully.
    """
    api_key = settings.cricbuzz_api_key or settings.rapidapi_key
    # Note: settings field is named cricbuzz_api_key for legacy reasons —
    # we re-use it for CricAPI to avoid another env var. Set CRICBUZZ_API_KEY
    # in your .env to your cricapi.com key.
    if not api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # cricapi.com /currentMatches endpoint returns ongoing + upcoming
            r = await client.get(
                "https://api.cricapi.com/v1/currentMatches",
                params={"apikey": api_key, "offset": 0},
            )
            r.raise_for_status()
            data = r.json()
    except Exception:
        return None

    matches = (data or {}).get("data") or []
    today_iso = date.today().isoformat()
    team_keywords = [user_team.name.lower(), user_team.id.lower()]

    for m in matches:
        # Filter to IPL today
        series_name = (m.get("series") or "").lower()
        if "indian premier league" not in series_name and "ipl" not in series_name:
            continue
        date_str = (m.get("dateTimeGMT") or "")[:10]
        if date_str != today_iso:
            continue
        teams = [t.lower() for t in (m.get("teams") or [])]
        if not any(any(kw in t for kw in team_keywords) for t in teams):
            continue

        # Found a match. Parse into our shape.
        teams_raw = m.get("teams") or []
        our_idx = next(
            (i for i, t in enumerate(teams_raw)
             if any(kw in t.lower() for kw in team_keywords)),
            0,
        )
        opp_idx = 1 - our_idx
        opponent_name = teams_raw[opp_idx] if len(teams_raw) > opp_idx else None

        match_started = m.get("matchStarted")
        match_ended = m.get("matchEnded")
        status_text = (m.get("status") or "").lower()

        # Score parsing — CricAPI gives an array of innings totals per team.
        scores = m.get("score") or []
        def _score_for(team_name: str | None) -> str | None:
            if not team_name:
                return None
            for s in scores:
                if (s.get("inning") or "").lower().startswith(team_name.lower()):
                    runs = s.get("r"); wkts = s.get("w"); overs = s.get("o")
                    return f"{runs}/{wkts} ({overs})"
            return None

        if not match_started:
            return TodayMatch(
                status="upcoming",
                user_team_id=user_team.id,
                user_team_name=user_team.name,
                opponent_team_name=opponent_name,
                venue=m.get("venue"),
                start_time=m.get("dateTimeGMT"),
                message=f"{user_team.name} play today.",
            )

        if not match_ended:
            return TodayMatch(
                status="live",
                user_team_id=user_team.id,
                user_team_name=user_team.name,
                opponent_team_name=opponent_name,
                venue=m.get("venue"),
                user_team_score=_score_for(teams_raw[our_idx]),
                opponent_score=_score_for(opponent_name),
                message=f"{user_team.name} are playing right now.",
            )

        # Match ended — figure out who won.
        won = any(kw in status_text for kw in team_keywords)
        return TodayMatch(
            status="won" if won else "lost",
            user_team_id=user_team.id,
            user_team_name=user_team.name,
            opponent_team_name=opponent_name,
            venue=m.get("venue"),
            user_team_score=_score_for(teams_raw[our_idx]),
            opponent_score=_score_for(opponent_name),
            result_summary=m.get("status"),
            message=f"{user_team.name} {'won! 🎉' if won else 'fell short. Well played.'}",
        )

    return None  # no IPL match today for this team


# ----- endpoint -------------------------------------------------------------

@router.get("/", response_model=TodayMatch)
async def today(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> TodayMatch:
    if not user.favorite_team_id:
        raise HTTPException(status_code=400, detail="Set a favorite team first")
    team = db.get(Team, user.favorite_team_id)
    if not team:
        raise HTTPException(status_code=400, detail="Favorite team not found")

    # Prefer live API; fall back to mock.
    api_result = await _fetch_from_cricapi(team)
    if api_result is not None:
        return api_result
    return _mock_today(team)