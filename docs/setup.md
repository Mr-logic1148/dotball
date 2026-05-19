# DotBall — First-time setup walkthrough

This is the very first thing you do after cloning (or unzipping) the scaffold.
Follow it once, end to end, and you'll have the app running locally and your
first commit pushed to GitHub.

## 0. Prerequisites

Install these once, then never again:

- VS Code (`code.visualstudio.com`)
- Node.js LTS (`nodejs.org`) — verify with `node -v`, expect v20+
- Python 3.11+ (`python.org`) — verify with `python --version`
- Git (`git-scm.com`) — verify with `git --version`
- A free GitHub account

## 1. Open the project in VS Code

```
File -> Open Folder -> select the dotball folder
```

When VS Code opens, it'll prompt you to install the recommended extensions
(from `.vscode/extensions.json`). Click "Install All".

## 2. Run the frontend

Open a VS Code terminal (`` Ctrl+` ``):

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. You should see the DotBall landing page with
the interactive Field Setter.

## 3. Run the backend (in a second terminal)

Click the `+` icon in the terminal panel to open a second terminal:

```bash
cd backend
python -m venv .venv
# macOS / Linux:
source .venv/bin/activate
# Windows PowerShell:
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` — you should see the FastAPI Swagger UI
with the players and strategy endpoints listed. Try the
`POST /api/strategy/field/recommend` endpoint with this body:

```json
{ "phase": "powerplay", "bowler": "pace", "batter": "rhb" }
```

## 4. First commit to GitHub

In VS Code:

1. Click the **Accounts icon** (bottom-left) and "Sign in with GitHub". Authorize in the browser.
2. Open the **Source Control panel** (`Ctrl+Shift+G`).
3. Click "Initialize Repository".
4. Type a commit message: `Initial DotBall scaffold`
5. Click the checkmark (Commit).
6. Click "Publish Branch" — VS Code creates a private GitHub repo and pushes everything.

You're now version-controlled.

## 5. Daily rhythm

Every time you finish a chunk of work:

1. Source Control panel
2. Stage changes (`+` next to files)
3. Type a clear message ("Add WagonWheel component", "Wire field recommend to live data")
4. Commit (checkmark)
5. Sync Changes

Keep commits small and focused. Future-you will thank present-you.

## 6. When things break

- **`npm install` fails** — delete `frontend/node_modules` and `frontend/package-lock.json`, try again. Make sure Node is v20+.
- **`pip install` fails on `psycopg`** — that's the Postgres driver; you can comment it out in `requirements.txt` until you actually wire up Postgres.
- **CORS errors in the browser** — make sure `backend/app/main.py` has `http://localhost:3000` in `allow_origins` (it does by default).
- **Port already in use** — kill the old process or use a different port: `npm run dev -- -p 3001`.

## Next milestone

Once everything runs locally:

1. Download a Cricsheet IPL zip from `cricsheet.org/downloads/`, drop it in `data/raw/`.
2. Stub out `backend/app/db.py` with a SQLAlchemy session factory.
3. Wire `ingest_cricsheet.py` to actually write to Postgres.
4. Replace the seed `SEED` list in `players.py` with a real DB query.

That gets you from "static demo" to "real cricket database" — the foundation for everything else on the roadmap.
