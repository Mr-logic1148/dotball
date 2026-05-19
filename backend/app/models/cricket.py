"""SQLAlchemy models for the DotBall data warehouse.

Schema follows the natural cricket hierarchy:
    Match -> Innings -> Ball

Plus dimension tables for Player, Team, Venue.

The `Ball` table is the grain on which DotBall is built — wagon wheels,
matchups, win-probability all roll up from here.
"""

from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
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
    name = Column(String, nullable=False, index=True)
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
    competition = Column(String, nullable=False, index=True)
    season = Column(String, index=True)
    match_date = Column(Date, nullable=False, index=True)
    venue_id = Column(String, ForeignKey("venues.id"))
    team_home_id = Column(String, ForeignKey("teams.id"))
    team_away_id = Column(String, ForeignKey("teams.id"))
    toss_winner_id = Column(String, ForeignKey("teams.id"))
    toss_decision = Column(String)    # bat, field
    winner_id = Column(String, ForeignKey("teams.id"))
    result_margin = Column(String)    # "8 wickets", "27 runs"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    innings = relationship("Innings", back_populates="match",
                        cascade="all, delete-orphan")
    balls = relationship("Ball", back_populates="match",
                        cascade="all, delete-orphan")


class Innings(Base):
    __tablename__ = "innings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False, index=True)
    innings_number = Column(Integer, nullable=False)  # 1 or 2
    batting_team_id = Column(String, ForeignKey("teams.id"))
    bowling_team_id = Column(String, ForeignKey("teams.id"))
    total_runs = Column(Integer)
    total_wickets = Column(Integer)
    total_overs = Column(Float)

    match = relationship("Match", back_populates="innings")


class Ball(Base):
    """One row per delivery. Everything else rolls up from here."""

    __tablename__ = "balls"
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False)
    innings_number = Column(Integer, nullable=False)
    over = Column(Integer, nullable=False)            # 0-indexed; 0 = first over
    ball = Column(Integer, nullable=False)            # 1-6 (more if extras)

    batter_id = Column(String, ForeignKey("players.id"), index=True)
    non_striker_id = Column(String, ForeignKey("players.id"))
    bowler_id = Column(String, ForeignKey("players.id"), index=True)

    runs_batter = Column(Integer, default=0, nullable=False)
    runs_extras = Column(Integer, default=0, nullable=False)
    runs_total = Column(Integer, default=0, nullable=False)
    extras_type = Column(String)                       # wide, nb, lb, b, pen

    wicket = Column(Boolean, default=False, nullable=False)
    dismissal_kind = Column(String)                   # bowled, caught, lbw, ...
    dismissed_id = Column(String, ForeignKey("players.id"))

    # Derived fields populated by the ingester — used by the wagon wheel:
    phase = Column(String, index=True)        # powerplay, middle, death
    is_boundary = Column(Boolean, default=False)  # 4 or 6 off the bat
    # wagon_zone: 1-8 around the wicket, clockwise from third man (for RHB).
    # 1=third man, 2=point, 3=cover, 4=mid-off,
    # 5=mid-on, 6=midwicket, 7=square leg, 8=fine leg.
    # Heuristically assigned from shot/landing data when present, else null.
    wagon_zone = Column(Integer)

    # Optional enrichment fields (populated when source has them):
    line = Column(String)        # off, leg, middle, wide
    length = Column(String)      # yorker, full, good, short, bouncer
    shot = Column(String)        # cover-drive, sweep, pull, ...

    match = relationship("Match", back_populates="balls")


# Composite indexes that pay off for the common queries:
Index("ix_balls_match_innings_over_ball",
    Ball.match_id, Ball.innings_number, Ball.over, Ball.ball)
Index("ix_balls_batter_bowler", Ball.batter_id, Ball.bowler_id)