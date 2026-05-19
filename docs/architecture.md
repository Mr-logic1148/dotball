# DotBall — Architecture overview

## Why this stack

**Next.js (frontend)** — React with file-based routing, server components for fast stat-page loads, and free Vercel deploys. The largest visualization ecosystem of any JS framework.

**FastAPI (backend)** — Python wins because the data-science work (matchup models, win-probability, opposition reports) lives in pandas, scikit-learn, and XGBoost. FastAPI gives us a typed, async HTTP layer that auto-generates OpenAPI docs at `/docs`.

**Postgres + Redis** — Cricket is naturally relational (match → innings → over → ball). Postgres handles the historical warehouse; Redis caches live match state so we can push WebSocket updates without hammering the DB.

## Data flow

```
Cricsheet ZIP (JSON)
    └─> ingest_cricsheet.py
         └─> Postgres (matches, innings, balls)
              ├─> /api/players, /api/strategy  (FastAPI)
              │     └─> Next.js pages, FieldSetter, WagonWheel
              └─> Training pipelines
                    └─> Win-probability model artifact
```

## Module boundaries

| Module | Owns |
|---|---|
| `frontend/app/components/FieldSetter.tsx` | Field placement UI, preset rendering |
| `backend/app/routers/strategy.py` | Strategy API, mirrors FieldSetter logic server-side |
| `backend/app/services/ingest_cricsheet.py` | Bulk historical data load |
| `backend/app/models/cricket.py` | The relational schema; single source of truth for cricket entities |

## Open decisions (to revisit)

- **Single source for field presets** — currently duplicated in `FieldSetter.tsx` and `strategy.py`. Week 2 refactor: move to `data/presets/fields.json` and import from both sides.
- **Live data provider** — Cricbuzz, RapidAPI, or SportRadar. Pick one in week 10 based on cost and licence.
- **Auth** — start with GitHub OAuth (simplest), add Google later. Players, captains, and coaches see different feature sets based on role.
