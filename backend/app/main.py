"""DotBall API — T20 cricket strategy backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, health, innings, players, strategy, today

app = FastAPI(
    title="DotBall API",
    description="T20 cricket strategy backend with IPL 2026 live integration.",
    version="0.3.0",
)

# Cookies require allow_credentials=True AND a specific origin (not "*").
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(today.router, prefix="/api/today", tags=["today"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["strategy"])
app.include_router(innings.router, prefix="/api/innings", tags=["innings"])


@app.get("/")
def root() -> dict[str, str]:
    return {"app": "DotBall", "version": "0.3.0", "docs": "/docs"}