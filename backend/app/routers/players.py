"""Player endpoints. Currently returns seed data; will pull from Postgres
once the Cricsheet ingestion script lands in week 1.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class Player(BaseModel):
    id: str
    name: str
    role: str
    batting_hand: str
    bowling_style: str | None = None


SEED: list[Player] = [
    Player(id="surya", name="Suryakumar Yadav", role="batter",
           batting_hand="RHB"),
    Player(id="bumrah", name="Jasprit Bumrah", role="bowler",
           batting_hand="RHB", bowling_style="right-arm fast"),
    Player(id="rashid", name="Rashid Khan", role="bowler",
           batting_hand="RHB", bowling_style="leg-spin"),
    Player(id="maxwell", name="Glenn Maxwell", role="all-rounder",
           batting_hand="RHB", bowling_style="off-spin"),
    Player(id="warner", name="David Warner", role="batter",
           batting_hand="LHB"),
]


@router.get("/", response_model=list[Player])
def list_players() -> list[Player]:
    return SEED


@router.get("/{player_id}", response_model=Player)
def get_player(player_id: str) -> Player:
    for p in SEED:
        if p.id == player_id:
            return p
    raise HTTPException(status_code=404, detail="Player not found")
