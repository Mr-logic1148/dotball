# DotBall

**Pressure, ball by ball.**

DotBall is a T20 cricket coaching and strategy platform for players, captains, coaches, and analysts. It turns historical and live ball-by-ball data into the kind of decisions that win matches: field placements, bowling changes, matchup picks, and squad selection.

## What it does

- **Match strategy & field placements** — interactive field setter with phase-aware legality, preset library, and a captain's plan engine
- **Player performance hub** — wagon wheels, pitch maps, phase splits, radar comparisons
- **Matchup analyzer** — every ball ever bowled between any two players, broken down by line, length, and outcome
- **Opposition scouting reports** — one-page tactical briefs generated from historical data
- **Live match assistant** — win probability, bowling-change recommender, dew-factor alerts
- **Auction & squad builder** — budget-constrained team picker with role balance and Impact Player slot

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, D3.js, Recharts, Framer Motion |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL (structured stats), Redis (live match cache) |
| ML | pandas, scikit-learn, XGBoost |
| Data sources | Cricsheet.org (historical), Cricbuzz / RapidAPI (live) |
| Deployment | Vercel (frontend), Railway or Render (backend) |

## Repository structure

```
dotball/
├── frontend/          Next.js app
│   └── app/
│       ├── components/   reusable UI (FieldSetter, WagonWheel, etc.)
│       └── api/          Next.js route handlers
├── backend/           FastAPI app
│   └── app/
│       ├── routers/      API endpoints (players, matches, strategy)
│       ├── models/       SQLAlchemy ORM models
│       └── services/     business logic (matchup engine, win-prob)
├── data/              Cricsheet downloads (gitignored if large)
│   ├── raw/
│   └── processed/
└── docs/              architecture notes, API spec
```

## Prerequisites

Install these once on your machine:

- [VS Code](https://code.visualstudio.com)
- [Node.js LTS](https://nodejs.org) (v20 or later)
- [Python 3.11+](https://python.org)
- [Git](https://git-scm.com)
- A free [GitHub account](https://github.com)

## Local setup

Clone the repo, then in two separate terminals:

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs`.

## Roadmap

| Phase | Weeks | Scope |
|---|---|---|
| 1 | 1-2 | Project scaffold, Cricsheet ingestion, player search |
| 2 | 3-5 | Field setter v1 + captain's plan engine (hero feature) |
| 3 | 6-7 | Player performance hub (wagon wheels, pitch maps) |
| 4 | 8-9 | Matchup analyzer + scouting reports |
| 5 | 10-11 | Live match assistant + win-probability model |
| 6 | 12 | Polish, mobile QA, deploy |

## Data attribution

Historical ball-by-ball data comes from [Cricsheet](https://cricsheet.org) under their open data license. Live data sources require their own API keys — see `.env.example`.

## License

MIT. See `LICENSE`.
