"""Authentication and user-management endpoints.

Cookie strategy: JWT in an HTTP-only cookie named `dotball_session`.
HTTP-only means JavaScript can't read it — that's the whole point;
it stops XSS attacks from stealing tokens. The cookie is sent
automatically by the browser on subsequent requests.

For local dev, secure=False is fine. In production, flip secure=True
and set samesite="strict" via env config.
"""

from datetime import date

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.auth import Season, User
from app.models.cricket import Team
from app.services.security import (
    create_token, decode_token, hash_password, verify_password,
)

router = APIRouter()

COOKIE_NAME = "dotball_session"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days, seconds


# ----- request / response schemas -------------------------------------------

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    dob: date
    favorite_team_id: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TeamOut(BaseModel):
    id: str
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    dob: date
    favorite_team: TeamOut | None
    team_changed_this_season: bool


class ChangeTeamIn(BaseModel):
    favorite_team_id: str


# ----- dependency: current user from cookie ---------------------------------

def current_user(
    dotball_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not dotball_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(dotball_session)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _user_to_out(user: User, db: Session) -> UserOut:
    team_out: TeamOut | None = None
    if user.favorite_team_id:
        t = db.get(Team, user.favorite_team_id)
        if t:
            team_out = TeamOut(id=t.id, name=t.name)
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        dob=user.dob,
        favorite_team=team_out,
        team_changed_this_season=user.team_changed_this_season,
    )


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # set True in production over HTTPS
        path="/",
    )


# ----- endpoints ------------------------------------------------------------

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)) -> UserOut:
    existing = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    team = db.get(Team, payload.favorite_team_id)
    if not team or team.competition != "ipl":
        raise HTTPException(status_code=400, detail="Invalid IPL team")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        dob=payload.dob,
        favorite_team_id=payload.favorite_team_id,
        team_changed_this_season=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, create_token(user.id))
    return _user_to_out(user, db)


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)) -> UserOut:
    user = db.execute(
        select(User).where(User.email == payload.email.lower())
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        # Same error for both cases — don't leak which is wrong.
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _set_session_cookie(response, create_token(user.id))
    return _user_to_out(user, db)


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_to_out(user, db)


@router.post("/change-team", response_model=UserOut)
def change_team(
    payload: ChangeTeamIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if user.team_changed_this_season:
        raise HTTPException(
            status_code=403,
            detail="You've already changed your team this season. You can switch again next IPL season.",
        )
    team = db.get(Team, payload.favorite_team_id)
    if not team or team.competition != "ipl":
        raise HTTPException(status_code=400, detail="Invalid IPL team")
    if team.id == user.favorite_team_id:
        raise HTTPException(status_code=400, detail="That's already your team")

    user.favorite_team_id = team.id
    user.team_changed_this_season = True
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)


# ----- IPL teams endpoint (public, used by registration UI) -----------------

class IplTeam(BaseModel):
    id: str
    name: str


@router.get("/ipl-teams", response_model=list[IplTeam])
def list_ipl_teams(db: Session = Depends(get_db)) -> list[IplTeam]:
    rows = db.execute(
        select(Team).where(Team.competition == "ipl").order_by(Team.name)
    ).scalars().all()
    return [IplTeam(id=t.id, name=t.name) for t in rows]