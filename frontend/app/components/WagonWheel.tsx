"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import type { Phase, WagonBall, WagonWheelResponse } from "../lib/types";

// ----- geometry --------------------------------------------------------------
// SVG is 360x360, pitch center at (180,180), boundary radius 168.
// Wagon zones 1..8 are arranged clockwise from third man (12 o'clock).
// Each zone owns a 45 degree arc. We jitter inside the arc so balls don't stack.

const CENTER = 180;
const RADIUS_PITCH = 22;
const RADIUS_BOUNDARY = 168;
const RADIUS_INNER = 95;

// Zone center angles in radians (12 o'clock = -PI/2, clockwise).
const ZONE_ANGLES: Record<number, number> = {
  1: -Math.PI / 2, // third man
  2: -Math.PI / 4, // point / cover
  3: 0, // cover / extra cover
  4: Math.PI / 4, // mid-off
  5: Math.PI / 2, // mid-on / long-on
  6: (3 * Math.PI) / 4, // midwicket
  7: Math.PI, // square leg
  8: -(3 * Math.PI) / 4, // fine leg
};

const ZONE_LABELS: Record<number, string> = {
  1: "Third man",
  2: "Point",
  3: "Cover",
  4: "Mid-off",
  5: "Long-on",
  6: "Midwicket",
  7: "Square leg",
  8: "Fine leg",
};

function ballEndpoint(b: WagonBall): { x: number; y: number; angle: number } {
  // Distance scales with runs — singles fall inside the ring, boundaries clear it.
  const base =
    b.runs_batter >= 6
      ? RADIUS_BOUNDARY - 6
      : b.runs_batter >= 4
        ? RADIUS_BOUNDARY - 30
        : RADIUS_PITCH + 18 + b.runs_batter * 20;

  // Deterministic jitter within +/- 15deg of zone center, seeded by over+ball.
  const seed = (b.over * 7 + b.ball * 13) % 30;
  const jitter = ((seed - 15) * Math.PI) / 180;
  const angle = ZONE_ANGLES[b.wagon_zone] + jitter;

  return {
    x: CENTER + Math.cos(angle) * base,
    y: CENTER + Math.sin(angle) * base,
    angle,
  };
}

function colorFor(runs: number): string {
  if (runs >= 6) return "#993C1D"; // ball-600
  if (runs >= 4) return "#D85A30"; // ball-400
  return "#185FA5"; // blue-600
}

// ----- component -------------------------------------------------------------

export default function WagonWheel({
  matchId,
  inningsNumber = 1,
}: {
  matchId: string;
  inningsNumber?: number;
}) {
  const [data, setData] = useState<WagonWheelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<Phase | "all">("all");
  const [batterFilter, setBatterFilter] = useState<string>("all");
  const [hovered, setHovered] = useState<WagonBall | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api<WagonWheelResponse>(
      `/api/innings/matches/${encodeURIComponent(matchId)}/innings/${inningsNumber}/wagon`,
    )
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [matchId, inningsNumber]);

  // Distinct batters in this innings (for the filter dropdown).
  const batters = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    for (const b of data.balls) {
      if (b.batter_id && b.batter_name && !seen.has(b.batter_id)) {
        seen.set(b.batter_id, b.batter_name);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.balls.filter(
      (b) =>
        (phaseFilter === "all" || b.phase === phaseFilter) &&
        (batterFilter === "all" || b.batter_id === batterFilter),
    );
  }, [data, phaseFilter, batterFilter]);

  const summary = useMemo(() => {
    if (filtered.length === 0) {
      return { runs: 0, balls: 0, fours: 0, sixes: 0 };
    }
    return filtered.reduce(
      (acc, b) => ({
        runs: acc.runs + b.runs_batter,
        balls: acc.balls + 1,
        fours: acc.fours + (b.runs_batter === 4 ? 1 : 0),
        sixes: acc.sixes + (b.runs_batter === 6 ? 1 : 0),
      }),
      { runs: 0, balls: 0, fours: 0, sixes: 0 },
    );
  }, [filtered]);

  if (error) {
    return (
      <div className="rounded-md bg-ball-50 px-4 py-3 text-sm text-ball-900">
        Couldn't load wagon wheel: {error}. Make sure the backend is running on{" "}
        <code>localhost:8000</code> and you've ingested some matches.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl bg-pitch-50 p-3">
        <svg
          viewBox="0 0 360 360"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-auto w-full"
          role="img"
          aria-label={`Wagon wheel for innings ${inningsNumber} of ${matchId}`}
        >
          {/* Outfield and inner ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS_BOUNDARY}
            fill="#97C459"
            stroke="#639922"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS_INNER}
            fill="none"
            stroke="#fff"
            strokeDasharray="3 3"
            opacity={0.6}
          />
          {/* Zone divider lines */}
          <g stroke="#fff" strokeWidth={0.5} opacity={0.35}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = -Math.PI / 2 + (i * Math.PI) / 4 + Math.PI / 8;
              return (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={CENTER + Math.cos(a) * RADIUS_BOUNDARY}
                  y2={CENTER + Math.sin(a) * RADIUS_BOUNDARY}
                />
              );
            })}
          </g>
          {/* Pitch */}
          <rect
            x={CENTER - 8}
            y={CENTER - 22}
            width={16}
            height={44}
            fill="#FAEEDA"
            stroke="#BA7517"
          />

          {/* Shot lines */}
          {filtered.map((b, i) => {
            const { x, y } = ballEndpoint(b);
            return (
              <g
                key={i}
                onMouseEnter={() => setHovered(b)}
                onMouseLeave={() => setHovered(null)}
              >
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke={colorFor(b.runs_batter)}
                  strokeWidth={b.is_boundary ? 3 : 2}
                  strokeLinecap="round"
                  opacity={0.82}
                />
                {b.is_boundary && (
                  <circle
                    cx={x}
                    cy={y}
                    r={b.runs_batter === 6 ? 4 : 3}
                    fill={colorFor(b.runs_batter)}
                  />
                )}
              </g>
            );
          })}

          {/* Zone labels (only top three to keep clean) */}
          {[1, 3, 5, 7].map((z) => {
            const angle = ZONE_ANGLES[z];
            const lx = CENTER + Math.cos(angle) * (RADIUS_BOUNDARY - 14);
            const ly = CENTER + Math.sin(angle) * (RADIUS_BOUNDARY - 14);
            return (
              <text
                key={z}
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                fontSize={9}
                fill="#fff"
                opacity={0.9}
              >
                {ZONE_LABELS[z]}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Side panel */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-pitch-900/60">Batter</span>
            <select
              value={batterFilter}
              onChange={(e) => setBatterFilter(e.target.value)}
              className="w-full rounded-md border border-pitch-900/15 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All batters</option>
              {batters.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-pitch-900/60">Phase</span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value as Phase | "all")}
              className="w-full rounded-md border border-pitch-900/15 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All phases</option>
              <option value="powerplay">Powerplay (1-6)</option>
              <option value="middle">Middle (7-15)</option>
              <option value="death">Death (16-20)</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-pitch-900/10">
          <div className="text-xs text-pitch-900/60">
            {batterFilter === "all"
              ? "Innings total"
              : batters.find((b) => b.id === batterFilter)?.name}
          </div>
          <div className="text-xl font-medium">
            {summary.runs}{" "}
            <span className="text-sm text-pitch-900/60">({summary.balls})</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Fours" value={summary.fours} />
            <Stat label="Sixes" value={summary.sixes} />
          </div>
          {hovered && (
            <div className="mt-3 rounded-md bg-pitch-50 px-3 py-2 text-xs text-pitch-900/80">
              <div className="font-medium">
                {hovered.over}.{hovered.ball} · {hovered.runs_batter} run
                {hovered.runs_batter === 1 ? "" : "s"}
              </div>
              <div>
                {hovered.batter_name ?? "?"} vs {hovered.bowler_name ?? "?"} ·{" "}
                {ZONE_LABELS[hovered.wagon_zone]}
              </div>
            </div>
          )}
        </div>

        <Legend />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-pitch-50 px-3 py-2">
      <div className="text-xs text-pitch-900/60">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-col gap-1.5 text-xs text-pitch-900/70">
      <LegendRow color="#993C1D" label="Six" />
      <LegendRow color="#D85A30" label="Four" />
      <LegendRow color="#185FA5" label="1-3 runs" />
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-[3px] w-4 rounded-sm"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
