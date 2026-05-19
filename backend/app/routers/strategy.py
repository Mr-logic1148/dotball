"""Strategy endpoints. The recommend endpoint mirrors the FieldSetter logic
on the server side, so other clients (mobile, CLI) can hit the same brain.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter()

Phase = Literal["powerplay", "middle", "death"]
Bowler = Literal["pace", "lpace", "offspin", "legspin"]
Batter = Literal["rhb", "lhb"]


class FieldRecommendRequest(BaseModel):
    phase: Phase
    bowler: Bowler
    batter: Batter
    venue: str | None = Field(default=None, description="Optional venue id, e.g. 'wankhede'")


class Fielder(BaseModel):
    x: int
    y: int
    label: str


class FieldRecommendation(BaseModel):
    name: str
    inside_count: int
    outside_count: int
    plan: str
    fielders: list[Fielder]


def _bucket(b: Bowler) -> Literal["pace", "spin"]:
    return "pace" if b in ("pace", "lpace") else "spin"


# Mirror of the frontend SETUPS dict; in production both load from a single source.
_SETUPS: dict[str, FieldRecommendation] = {
    "powerplay_pace_rhb": FieldRecommendation(
        name="Attacking powerplay",
        inside_count=7, outside_count=2,
        plan="Two slips, gully, point in the ring. Mid-off and mid-on up. "
             "Fine leg and third man are the only sweepers — force the false shot.",
        fielders=[
            Fielder(x=180, y=90, label="BWL"),
            Fielder(x=225, y=140, label="SLP"),
            Fielder(x=245, y=155, label="GLY"),
            Fielder(x=260, y=200, label="PNT"),
            Fielder(x=230, y=250, label="COV"),
            Fielder(x=150, y=250, label="MDO"),
            Fielder(x=110, y=210, label="MDW"),
            Fielder(x=120, y=90, label="TM"),
            Fielder(x=270, y=90, label="FL"),
        ],
    ),
    # TODO: port the remaining 11 setups from FieldSetter.tsx here.
    # Keeping them in one place will be the week 2 refactor — both
    # frontend and backend should read from a shared JSON file in /data.
}


@router.post("/field/recommend", response_model=FieldRecommendation)
def recommend_field(req: FieldRecommendRequest) -> FieldRecommendation:
    key = f"{req.phase}_{_bucket(req.bowler)}_{req.batter}"
    return _SETUPS.get(key, _SETUPS["powerplay_pace_rhb"])
