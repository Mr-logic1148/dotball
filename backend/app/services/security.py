"""Authentication primitives: password hashing and JWT.

bcrypt for passwords (industry standard, salted automatically).
JWT for session tokens (signed with JWT_SECRET from .env, HS256).
Tokens last 30 days — they're stored in HTTP-only cookies on the client.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import settings


TOKEN_LIFETIME_DAYS = 30
ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    """Bcrypt-hash a password. The salt is embedded in the result."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode(), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=TOKEN_LIFETIME_DAYS)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None