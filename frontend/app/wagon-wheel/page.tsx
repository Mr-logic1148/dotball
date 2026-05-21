"use client";

import { useEffect, useState } from "react";

import WagonWheel from "../components/WagonWheel";
import { api } from "../lib/api";
import type { MatchSummary } from "../lib/types";

export default function WagonWheelPage() {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [inningsNumber, setInningsNumber] = useState<1 | 2>(1);

  useEffect(() => {
    api<MatchSummary[]>("/api/innings/matches?limit=30")
      .then((rows) => {
        setMatches(rows);
        if (rows.length) setMatchId(rows[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <a href="/" className="text-sm text-pitch-900/60 hover:underline">
        &larr; Back to home
      </a>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Wagon wheel</h1>
        <p className="mt-2 max-w-2xl text-pitch-900/70">
          Every scoring shot plotted around the wicket. Filter by batter and
          phase.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pitch-900/10">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs text-pitch-900/60">Match</span>
            <select
              value={matchId ?? ""}
              onChange={(e) => setMatchId(e.target.value || null)}
              className="w-full rounded-md border border-pitch-900/15 bg-white px-3 py-2 text-sm"
              disabled={!matches?.length}
            >
              {matches?.length ? (
                matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.match_date} · {m.competition} · {m.id}
                  </option>
                ))
              ) : (
                <option>Loading matches…</option>
              )}
            </select>
          </label>
          <label className="block md:w-44">
            <span className="mb-1 block text-xs text-pitch-900/60">
              Innings
            </span>
            <select
              value={inningsNumber}
              onChange={(e) =>
                setInningsNumber(Number(e.target.value) as 1 | 2)
              }
              className="w-full rounded-md border border-pitch-900/15 bg-white px-3 py-2 text-sm"
            >
              <option value={1}>1st innings</option>
              <option value={2}>2nd innings</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-ball-50 px-4 py-3 text-sm text-ball-900">
            Couldn't load matches: {error}. Run the ingester:{" "}
            <code className="font-mono text-xs">
              python -m app.services.ingest_cricsheet --source
              data/raw/ipl_json.zip --limit 5
            </code>
          </div>
        )}

        {matches?.length === 0 && (
          <div className="mb-4 rounded-md bg-pitch-50 px-4 py-3 text-sm text-pitch-900/80">
            No matches in the database yet. Download a Cricsheet zip and run the
            ingester.
          </div>
        )}

        {matchId && (
          <WagonWheel matchId={matchId} inningsNumber={inningsNumber} />
        )}
      </section>
    </main>
  );
}
