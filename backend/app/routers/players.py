"""Player endpoints — now backed by the database."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.cricket import Player as PlayerModel

router = APIRouter()


class Player(BaseModel):
    id: str
    name: str
    role: str | None = None
    batting_hand: str | None = None
    bowling_style: str | None = None


@router.get("/", response_model=list[Player])
def list_players(
    q: str | None = Query(None, description="Search by name (partial match)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Player]:
    stmt = select(PlayerModel).order_by(PlayerModel.name).limit(limit)
    if q:
       like = f"%{q}%"
       stmt = stmt.where(or_(
       PlayerModel.name.ilike(like),
       PlayerModel.id.ilike(like),
       ))
    return [Player.model_validate(p, from_attributes=True)
            for p in db.execute(stmt).scalars().all()]


@router.get("/{player_id}", response_model=Player)
def get_player(player_id: str, db: Session = Depends(get_db)) -> Player:
    p = db.get(PlayerModel, player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    return Player.model_validate(p, from_attributes=True)