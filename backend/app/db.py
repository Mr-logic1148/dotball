"""SQLAlchemy engine, session factory, and FastAPI dependency.

Defaults to SQLite (file: dotball.db in your backend folder) so you can run
ingestion and the API on day one without installing Postgres. When you're
ready, change DATABASE_URL in .env to a Postgres URL and everything keeps
working — same models, same queries.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.cricket import Base

# SQLite needs a small extra arg to allow access across FastAPI's threads.
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables. Use only for first-run bootstrap; production uses Alembic."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency. Use as: `db: Session = Depends(get_db)`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()