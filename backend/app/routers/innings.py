"""Innings and ball-level endpoints.

The wagon-wheel endpoint is the headline: given a match + innings + (optional
batter filter), it returns every scoring ball with a wagon zone, runs, phase,
and bowler — enough to render a full interactive wheel on the frontend.

Cricsheet doesn't include shot direction, so we generate a deterministic but
plausible wagon zone using a hash of (over, ball, batter, bowler). It produces
visually believable wheels for the demo; when you wire in real ball-tracking
later, just replace `_zone_for_ball` with a column read.
"""

from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.cricket import Ball, Innings, Match, Player

router = APIRouter()


# ----- response models ------------------------------------------------------

class MatchSummary(BaseModel):
    id: str
    competition: str
    season: str | None
    match_date: str
    venue_id: str | None


class WagonBall(BaseModel):
    over: int
    ball: int
    batter_id: str | None
    batter_name: str | None
    bowler_id: str | None
    bowler_name: str | None
    runs_batter: int
    phase: str | None
    wagon_zone: int
    is_boundary: bool


class WagonWheelResponse(BaseModel):
    match_id: str
    innings_number: int
    total_runs: int
    total_balls: int
    boundaries_4: int
    boundaries_6: int
    balls: list[WagonBall]


# ----- helpers --------------------------------------------------------------

def _zone_for_ball(
    over: int, ball: int, batter_id: str | None, bowler_id: str | None,
    stored_zone: int | None,
) -> int:
    """Use the stored zone if available; else hash to one of 8 zones."""
    if stored_zone is not None:
        return stored_zone
    key = f"{over}-{ball}-{batter_id or ''}-{bowler_id or ''}".encode()
    h = int(hashlib.md5(key).hexdigest()[:8], 16)
    return (h % 8) + 1  # zones 1..8


# ----- endpoints ------------------------------------------------------------

@router.get("/matches", response_model=list[MatchSummary])
def list_matches(
    competition: str | None = Query(None, description="e.g. 'ipl', 'bbl', 't20s'"),
    season: str | None = Query(None, description="e.g. '2024'"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[MatchSummary]:
    stmt = select(Match).order_by(Match.match_date.desc()).limit(limit)
    if competition:
        stmt = stmt.where(Match.competition == competition)
    if season:
        stmt = stmt.where(Match.season == season)
    rows = db.execute(stmt).scalars().all()
    return [
        MatchSummary(
            id=m.id, competition=m.competition, season=m.season,
            match_date=m.match_date.isoformat(), venue_id=m.venue_id,
        )
        for m in rows
    ]


@router.get(
    "/matches/{match_id}/innings/{innings_number}/wagon",
    response_model=WagonWheelResponse,
)
def wagon_wheel(
    match_id: str,
    innings_number: int,
    batter_id: str | None = Query(None, description="Filter to one batter"),
    db: Session = Depends(get_db),
) -> WagonWheelResponse:
    inn = db.execute(
        select(Innings).where(
            Innings.match_id == match_id,
            Innings.innings_number == innings_number,
        )
    ).scalar_one_or_none()
    if not inn:
        raise HTTPException(status_code=404, detail="Innings not found")

    # Pull every scoring ball off the bat (we ignore extras for the wheel).
    stmt = (
        select(Ball, Player.name.label("batter_name"))
        .join(Player, Player.id == Ball.batter_id, isouter=True)
        .where(
            Ball.match_id == match_id,
            Ball.innings_number == innings_number,
            Ball.runs_batter > 0,
        )
        .order_by(Ball.over, Ball.ball)
    )
    if batter_id:
        stmt = stmt.where(Ball.batter_id == batter_id)

    # Second query for bowler names — keeps the join simple.
    bowler_ids = db.execute(
        select(Ball.bowler_id).where(
            Ball.match_id == match_id,
            Ball.innings_number == innings_number,
        ).distinct()
    ).scalars().all()
    bowler_names = dict(
        db.execute(
            select(Player.id, Player.name).where(Player.id.in_(bowler_ids))
        ).all()
    )

    balls: list[WagonBall] = []
    for ball, batter_name in db.execute(stmt).all():
        balls.append(WagonBall(
            over=ball.over,
            ball=ball.ball,
            batter_id=ball.batter_id,
            batter_name=batter_name,
            bowler_id=ball.bowler_id,
            bowler_name=bowler_names.get(ball.bowler_id),
            runs_batter=ball.runs_batter,
            phase=ball.phase,
            wagon_zone=_zone_for_ball(
                ball.over, ball.ball, ball.batter_id,
                ball.bowler_id, ball.wagon_zone,
            ),
            is_boundary=ball.is_boundary,
        ))

    # Totals across the whole innings (not filtered by batter).
    totals = db.execute(
        select(
            func.sum(Ball.runs_total),
            func.count(Ball.id),
            func.sum(case((Ball.runs_batter == 4, 1), else_=0)),
            func.sum(case((Ball.runs_batter == 6, 1), else_=0)),
        ).where(
            Ball.match_id == match_id,
            Ball.innings_number == innings_number,
        )
    ).one()

    return WagonWheelResponse(
        match_id=match_id,
        innings_number=innings_number,
        total_runs=int(totals[0] or 0),
        total_balls=int(totals[1] or 0),
        boundaries_4=int(totals[2] or 0),
        boundaries_6=int(totals[3] or 0),
        balls=balls,
    )