"""Cricsheet ingestion script.

Downloads Cricsheet's all-T20-matches YAML/JSON dump and writes it into
the DotBall Postgres schema (see app/models/cricket.py).

Usage:
    python -m app.services.ingest_cricsheet --source data/raw/t20s_json.zip

Cricsheet publishes per-competition zips at https://cricsheet.org/downloads/
Recommended downloads for DotBall v1:
    - ipl_json.zip            (IPL)
    - bbl_json.zip            (Big Bash League)
    - psl_json.zip            (Pakistan Super League)
    - cpl_json.zip            (Caribbean Premier League)
    - t20s_json.zip           (Men's T20 Internationals)
    - t20s_female_json.zip    (Women's T20 Internationals)

This is a skeleton — the full implementation is week-1 work.
"""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path


def parse_match_json(payload: dict) -> dict:
    """Flatten one Cricsheet JSON match into our schema. To be implemented."""
    info = payload.get("info", {})
    return {
        "id": info.get("match_type_number") or info.get("event", {}).get("match_number"),
        "competition": info.get("event", {}).get("name") or info.get("match_type"),
        "match_date": info.get("dates", [None])[0],
        "venue": info.get("venue"),
        "teams": info.get("teams"),
        "toss": info.get("toss"),
        "outcome": info.get("outcome"),
        "innings_count": len(payload.get("innings", [])),
    }


def ingest_zip(zip_path: Path) -> None:
    if not zip_path.exists():
        raise SystemExit(f"File not found: {zip_path}")

    summary: dict[str, int] = {"matches": 0, "innings": 0}

    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            if not name.endswith(".json"):
                continue
            with zf.open(name) as fp:
                match = json.load(fp)
                parsed = parse_match_json(match)
                summary["matches"] += 1
                summary["innings"] += parsed["innings_count"]
                # TODO: insert into Postgres via SQLAlchemy session
                # TODO: per-ball insertion in a batched executemany

    print(f"Parsed {summary['matches']} matches, {summary['innings']} innings.")
    print("Database writes are TODO — wire app/db.py first.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="Path to Cricsheet zip")
    args = ap.parse_args()
    ingest_zip(Path(args.source))


if __name__ == "__main__":
    main()
