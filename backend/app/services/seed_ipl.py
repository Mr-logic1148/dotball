"""Seed script: populate IPL teams and the 2026 season.

Run once after migration:
    py -m app.services.seed_ipl

Idempotent — safe to re-run; existing rows are updated, not duplicated.
"""

from datetime import date

from sqlalchemy import select

from app.db import SessionLocal, init_db
from app.models.auth import Season
from app.models.cricket import Team


IPL_TEAMS = [
    # id (slug), name, short, primary color, secondary color
    ("csk", "Chennai Super Kings", "CSK", "#F9CD05", "#0081E9"),
    ("mi",  "Mumbai Indians",      "MI",  "#004B8D", "#D1AB3E"),
    ("rcb", "Royal Challengers Bengaluru", "RCB", "#DA1818", "#000000"),
    ("kkr", "Kolkata Knight Riders", "KKR", "#3A225D", "#F2C12E"),
    ("dc",  "Delhi Capitals",      "DC",  "#17449B", "#EF1C25"),
    ("srh", "Sunrisers Hyderabad", "SRH", "#FB643E", "#000000"),
    ("rr",  "Rajasthan Royals",    "RR",  "#EA1A85", "#254AA5"),
    ("pbks","Punjab Kings",        "PBKS","#DD1F2D", "#A57A2C"),
    ("gt",  "Gujarat Titans",      "GT",  "#1B2133", "#B5A157"),
    ("lsg", "Lucknow Super Giants","LSG", "#005CB9", "#FFCC00"),
]


def seed() -> None:
    init_db()
    with SessionLocal() as db:
        for tid, name, short, primary, secondary in IPL_TEAMS:
            existing = db.get(Team, tid)
            if existing:
                existing.name = name
                existing.competition = "ipl"
            else:
                db.add(Team(id=tid, name=name, competition="ipl"))

        # 2026 season — adjust dates if BCCI changes the schedule.
        season_id = "ipl-2026"
        existing_season = db.get(Season, season_id)
        if existing_season:
            existing_season.is_active = True
        else:
            # Deactivate any previously active season
            for prev in db.execute(select(Season).where(Season.is_active)).scalars():
                prev.is_active = False
            db.add(Season(
                id=season_id,
                competition="ipl",
                year=2026,
                start_date=date(2026, 3, 21),
                end_date=date(2026, 5, 31),
                is_active=True,
            ))

        db.commit()
    print(f"Seeded {len(IPL_TEAMS)} IPL teams and the 2026 season.")


if __name__ == "__main__":
    seed()