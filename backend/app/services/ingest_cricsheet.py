"""Cricsheet ingestion: load a competition zip into the DotBall database.

Cricsheet publishes one JSON file per match, bundled as zips per competition.
Get the latest IPL dump here: https://cricsheet.org/downloads/ipl_json.zip

Usage:
    # Make sure DATABASE_URL is set (defaults to SQLite in dotball.db).
    python -m app.services.ingest_cricsheet --source data/raw/ipl_json.zip

    # Only load 2024 IPL season:
    python -m app.services.ingest_cricsheet --source data/raw/ipl_json.zip --season 2024

    # Limit matches for a quick smoke test:
    python -m app.services.ingest_cricsheet --source data/raw/ipl_json.zip --limit 5

What gets loaded:
    teams, players, venues  — deduplicated dimension rows
    matches, innings        — one row per match / per innings
    balls                   — one row per delivery, with derived fields:
                            phase (powerplay/middle/death),
                            is_boundary, runs_total.

Wagon-zone assignment is heuristic — Cricsheet doesn't include shot-direction
data, so we leave `wagon_zone` null here. The wagon-wheel endpoint can either
generate synthetic zones from boundary-stat heuristics for the demo, or you
can layer in commercial ball-tracking data later.
"""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from datetime import date as date_type
from pathlib import Path
from typing import Any, Iterable

from sqlalchemy.orm import Session

from app.db import SessionLocal, init_db
from app.models.cricket import Ball, Innings, Match, Player, Team, Venue


# ----- helpers --------------------------------------------------------------

def _slug(value: str) -> str:
    """Tiny slugifier: 'Mumbai Indians' -> 'mumbai-indians'."""
    return (
        "".join(c.lower() if c.isalnum() else "-" for c in (value or ""))
        .strip("-")
        .replace("--", "-")
    )


def _phase(over_zero_indexed: int) -> str:
    """Standard T20 phase boundaries."""
    if over_zero_indexed < 6:
        return "powerplay"
    if over_zero_indexed < 15:
        return "middle"
    return "death"


def _parse_date(value: str | None) -> date_type | None:
    if not value:
        return None
    return date_type.fromisoformat(value)


def _iter_json_in_zip(zip_path: Path) -> Iterable[tuple[str, dict[str, Any]]]:
    """Yield (filename, parsed-json) for every match JSON in the zip."""
    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            if not name.endswith(".json") or name == "README.txt":
                continue
            with zf.open(name) as fp:
                yield name, json.load(fp)


# ----- per-match transform --------------------------------------------------

class Ingester:
    """Holds per-run caches so we only insert each dimension row once."""

    def __init__(self, db: Session, competition: str):
        self.db = db
        self.competition = competition
        self._teams: dict[str, str] = {}    # name -> id
        self._players: dict[str, str] = {}  # name -> id
        self._venues: dict[str, str] = {}   # name -> id

    # --- dimension upserts ---

    def team_id(self, name: str) -> str:
        if name in self._teams:
            return self._teams[name]
        tid = _slug(name)
        existing = self.db.get(Team, tid)
        if not existing:
            self.db.add(Team(id=tid, name=name, competition=self.competition))
        self._teams[name] = tid
        return tid

    def player_id(self, name: str) -> str:
        if name in self._players:
            return self._players[name]
        pid = _slug(name)
        existing = self.db.get(Player, pid)
        if not existing:
            self.db.add(Player(id=pid, name=name))
        self._players[name] = pid
        return pid

    def venue_id(self, name: str | None, city: str | None) -> str | None:
        if not name:
            return None
        if name in self._venues:
            return self._venues[name]
        vid = _slug(name)
        existing = self.db.get(Venue, vid)
        if not existing:
            self.db.add(Venue(id=vid, name=name, city=city))
        self._venues[name] = vid
        return vid

    # --- the meat ---

    def ingest_match(self, filename: str, payload: dict[str, Any]) -> int:
        info = payload.get("info", {})

        # ---- match metadata ----
        match_id = (
            str(info.get("event", {}).get("match_number"))
            if info.get("event", {}).get("match_number") is not None
            else Path(filename).stem
        )
        match_id = f"{self.competition}-{match_id}"

        # Skip if already loaded (idempotent re-runs).
        if self.db.get(Match, match_id):
            return 0

        dates = info.get("dates") or []
        match_date = _parse_date(dates[0] if dates else None)
        if match_date is None:
            return 0  # malformed match, skip

        season = str(info.get("season", match_date.year))
        teams_names = info.get("teams") or []
        if len(teams_names) != 2:
            return 0
        home_id = self.team_id(teams_names[0])
        away_id = self.team_id(teams_names[1])

        venue_id = self.venue_id(info.get("venue"), info.get("city"))

        toss = info.get("toss") or {}
        toss_winner_id = self.team_id(toss["winner"]) if toss.get("winner") else None

        outcome = info.get("outcome") or {}
        winner_id = self.team_id(outcome["winner"]) if outcome.get("winner") else None

        if outcome.get("by"):
            by = outcome["by"]
            margin = next(
                (f"{v} {k}" for k, v in by.items() if v is not None),
                None,
            )
        else:
            margin = outcome.get("result")  # tie, no result

        match = Match(
            id=match_id,
            competition=self.competition,
            season=season,
            match_date=match_date,
            venue_id=venue_id,
            team_home_id=home_id,
            team_away_id=away_id,
            toss_winner_id=toss_winner_id,
            toss_decision=toss.get("decision"),
            winner_id=winner_id,
            result_margin=margin,
        )
        self.db.add(match)

        # ---- innings & balls ----
        ball_rows: list[dict[str, Any]] = []
        ball_count = 0
        for idx, inn in enumerate(payload.get("innings") or [], start=1):
            batting_team = inn.get("team")
            batting_team_id = self.team_id(batting_team) if batting_team else None
            bowling_team_id = away_id if batting_team_id == home_id else home_id

            innings_runs = 0
            innings_wkts = 0
            last_over_idx = 0
            last_ball_idx = 0

            for over_block in inn.get("overs") or []:
                over_idx = over_block.get("over", 0)
                last_over_idx = max(last_over_idx, over_idx)
                for ball_idx, delivery in enumerate(
                    over_block.get("deliveries") or [], start=1
                ):
                    last_ball_idx = ball_idx
                    runs = delivery.get("runs") or {}
                    runs_batter = int(runs.get("batter", 0))
                    runs_extras = int(runs.get("extras", 0))
                    runs_total = int(runs.get("total", runs_batter + runs_extras))

                    extras = delivery.get("extras") or {}
                    extras_type = next(iter(extras.keys())) if extras else None

                    wickets = delivery.get("wickets") or []
                    wicket = bool(wickets)
                    dismissal_kind = wickets[0]["kind"] if wickets else None
                    dismissed_name = wickets[0].get("player_out") if wickets else None

                    ball_rows.append({
                        "match_id": match_id,
                        "innings_number": idx,
                        "over": over_idx,
                        "ball": ball_idx,
                        "batter_id": self.player_id(delivery["batter"])
                            if delivery.get("batter") else None,
                        "non_striker_id": self.player_id(delivery["non_striker"])
                            if delivery.get("non_striker") else None,
                        "bowler_id": self.player_id(delivery["bowler"])
                            if delivery.get("bowler") else None,
                        "runs_batter": runs_batter,
                        "runs_extras": runs_extras,
                        "runs_total": runs_total,
                        "extras_type": extras_type,
                        "wicket": wicket,
                        "dismissal_kind": dismissal_kind,
                        "dismissed_id": self.player_id(dismissed_name)
                            if dismissed_name else None,
                        "phase": _phase(over_idx),
                        "is_boundary": runs_batter in (4, 6),
                        "wagon_zone": None,  # Cricsheet has no shot direction
                    })
                    innings_runs += runs_total
                    if wicket:
                        innings_wkts += 1
                    ball_count += 1

            self.db.add(Innings(
                match_id=match_id,
                innings_number=idx,
                batting_team_id=batting_team_id,
                bowling_team_id=bowling_team_id,
                total_runs=innings_runs,
                total_wickets=innings_wkts,
                total_overs=last_over_idx + (last_ball_idx / 6.0),
            ))

        # Bulk insert balls for speed (ORM one-by-one is painfully slow).
        if ball_rows:
            self.db.bulk_insert_mappings(Ball, ball_rows)

        return ball_count


# ----- entrypoint -----------------------------------------------------------

def _competition_from_path(zip_path: Path) -> str:
    """Cricsheet zips are named like ipl_json.zip, bbl_json.zip, t20s_json.zip."""
    stem = zip_path.stem.replace("_json", "").replace("_male", "")
    return stem or "t20"


def ingest_zip(
    zip_path: Path,
    season: str | None = None,
    limit: int | None = None,
) -> dict[str, int]:
    competition = _competition_from_path(zip_path)
    print(f"Ingesting {competition!r} from {zip_path}")
    print("Creating tables if missing…")
    init_db()

    totals = {"matches": 0, "balls": 0, "skipped": 0}
    with SessionLocal() as db:
        ingester = Ingester(db, competition)
        for n, (filename, payload) in enumerate(_iter_json_in_zip(zip_path), 1):
            if season:
                info_season = str((payload.get("info") or {}).get("season", ""))
                # Cricsheet seasons are "2024" or "2023/24" — substring match handles both.
                if season not in info_season:
                    totals["skipped"] += 1
                    continue
            try:
                balls = ingester.ingest_match(filename, payload)
            except Exception as e:  # noqa: BLE001
                print(f"  ! {filename}: {e}", file=sys.stderr)
                continue
            if balls:
                totals["matches"] += 1
                totals["balls"] += balls
            if totals["matches"] % 25 == 0 and totals["matches"]:
                db.commit()
                print(f"  · committed {totals['matches']} matches, "
                    f"{totals['balls']} balls so far…")
            if limit and totals["matches"] >= limit:
                break

        db.commit()

    print(f"\n Done. Matches: {totals['matches']}, "
        f"Balls: {totals['balls']}, Skipped: {totals['skipped']}")
    return totals


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="Path to a Cricsheet zip")
    ap.add_argument("--season", help="Filter to one season, e.g. '2024'")
    ap.add_argument("--limit", type=int, help="Stop after N matches (smoke testing)")
    args = ap.parse_args()
    ingest_zip(Path(args.source), season=args.season, limit=args.limit)


if __name__ == "__main__":
    main()