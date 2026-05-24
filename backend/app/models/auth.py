"""User authentication models and season tracking.

The `users` table holds account info plus a `favorite_team_id` pointing at
one of the IPL teams. `team_changed_this_season` is reset to False each new
season, enforcing the once-per-season rule cleanly at the application layer.

Seasons are pre-populated by a small seed script; the active season is the
one where today's date falls between start_date and end_date.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, String, Integer
from sqlalchemy.orm import relationship

from app.models.cricket import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    dob = Column(Date, nullable=False)
    favorite_team_id = Column(String, ForeignKey("teams.id"))
    team_changed_this_season = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    favorite_team = relationship("Team", foreign_keys=[favorite_team_id])


class Season(Base):
    """One row per IPL season. Used to reset the team-change flag each year."""

    __tablename__ = "seasons"
    id = Column(String, primary_key=True)  # e.g. "ipl-2026"
    competition = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)