"""Smoke tests for the API. Run with: pytest"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_players():
    r = client.get("/api/players/")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_field_recommend():
    r = client.post(
        "/api/strategy/field/recommend",
        json={"phase": "powerplay", "bowler": "pace", "batter": "rhb"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "fielders" in body
    assert body["inside_count"] + body["outside_count"] == 9
