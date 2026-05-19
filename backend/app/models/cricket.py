"""SQLAlchemy models for the DotBall data warehouse.

Schema follows the natural cricket hierarchy:
    Match -> Innings -> Over -> Ball

Plus dimension tables for Player, Team, Venue.

Wire these to your Postgres DATABASE_URL in app/db.py
(create that file when you're ready to ingest real data).
"""

from datetime import date
from sqlalchemy import (
    Boolean, Column, Date, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Team(Base):
    __tablename__ = "teams"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    competition = Column(String, nullable=False)  # ipl, bbl, t20i, psl, ...


class Player(Base):
    __tablename__ = "players"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    role = Column(String)             # batter, bowler, all-rounder, wk
    batting_hand = Column(String)     # RHB, LHB
    bowling_style = Column(String)    # right-arm fast, leg-spin, ...


class Venue(Base):
    __tablename__ = "venues"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    city = Column(String)
    country = Column(String)
    avg_first_innings = Column(Integer)
    pitch_character = Column(String)  # belter, spin-friendly, two-paced, bouncy


class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True)
    competition = Column(String, nullable=False)
    match_date = Column(Date, nullable=False)
    venue_id = Column(String, ForeignKey("venues.id"))
    team_home_id = Column(String, ForeignKey("teams.id"))
    team_away_id = Column(String, ForeignKey("teams.id"))
    toss_winner_id = Column(String, ForeignKey("teams.id"))
    toss_decision = Column(String)    # bat, field
    winner_id = Column(String, ForeignKey("teams.id"))

    innings = relationship("Innings", back_populates="match")


class Innings(Base):
    __tablename__ = "innings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False)
    innings_number = Column(Integer, nullable=False)  # 1 or 2
    batting_team_id = Column(String, ForeignKey("teams.id"))
    total_runs = Column(Integer)
    total_wickets = Column(Integer)

    match = relationship("Match", back_populates="innings")


class Ball(Base):
    """One row per delivery. The grain on which DotBall is built."""
    __tablename__ = "balls"
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False)
    innings_number = Column(Integer, nullable=False)
    over = Column(Integer, nullable=False)            # 0-indexed
    ball = Column(Integer, nullable=False)            # 1-6 (more if extras)
    batter_id = Column(String, ForeignKey("players.id"))
    non_striker_id = Column(String, ForeignKey("players.id"))
    bowler_id = Column(String, ForeignKey("players.id"))
    runs_batter = Column(Integer, default=0)
    runs_extras = Column(Integer, default=0)
    extras_type = Column(String)                       # wide, nb, lb, b, pen
    wicket = Column(Boolean, default=False)
    dismissal_kind = Column(String)                   # bowled, caught, lbw, ...
    dismissed_id = Column(String, ForeignKey("players.id"))

    # Optional enrichment when source has it:
    line = Column(String)        # off, leg, middle, wide
    length = Column(String)      # yorker, full, good, short, bouncer
    shot = Column(String)        # cover-drive, sweep, pull, ...
    landing_x = Column(Integer)  # 0-100 pitch coord
    landing_y = Column(Integer)
