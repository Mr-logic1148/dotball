"""DotBall API — T20 cricket strategy backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, innings, players, strategy

app = FastAPI(
    title="DotBall API",
    description="T20 cricket strategy backend: players, matchups, field plans, wagon wheels.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["strategy"])
app.include_router(innings.router, prefix="/api/innings", tags=["innings"])


@app.get("/")
def root() -> dict[str, str]:
    return {"app": "DotBall", "version": "0.2.0", "docs": "/docs"}