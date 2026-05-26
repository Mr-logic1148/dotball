"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type Phase = "powerplay" | "middle" | "death";
type Bowler = "pace" | "lpace" | "offspin" | "legspin";
type Batter = "rhb" | "lhb";

interface Fielder {
  x: number;
  y: number;
  num: number;
  name: string; // canonical position name
  role: "bowler" | "keeper" | "fielder";
}

interface Setup {
  name: string;
  inside: number;
  outside: number;
  text: string;
  pos: Fielder[];
}

const bucket = (b: Bowler): "pace" | "spin" =>
  b === "pace" || b === "lpace" ? "pace" : "spin";

// All coordinates use a 400x400 SVG with stumps at (200, 200) and a 188 boundary.
// Positions are calculated geometrically from canonical cricket angles so the
// field looks accurate, not arbitrary. Inner ring = radius 110.
const SETUPS: Record<string, Setup> = {
  powerplay_pace_rhb: {
    name: "Attacking powerplay",
    inside: 7,
    outside: 2,
    text: "Two slips and gully attack the edge. Mid-off and mid-on up. Third man and fine leg out — force the false shot.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 244, y: 232, num: 3, name: "Slip", role: "fielder" },
      { x: 270, y: 220, num: 4, name: "Gully", role: "fielder" },
      { x: 280, y: 175, num: 5, name: "Point", role: "fielder" },
      { x: 252, y: 132, num: 6, name: "Mid-off", role: "fielder" },
      { x: 148, y: 132, num: 7, name: "Mid-on", role: "fielder" },
      { x: 320, y: 305, num: 8, name: "Third man", role: "fielder" },
      { x: 80, y: 305, num: 9, name: "Fine leg", role: "fielder" },
    ],
  },
  powerplay_pace_lhb: {
    name: "Attacking powerplay vs LHB",
    inside: 7,
    outside: 2,
    text: "Mirror the cordon to the LHB off side. Bowl fourth stump; induce the drive.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 156, y: 232, num: 3, name: "Slip", role: "fielder" },
      { x: 130, y: 220, num: 4, name: "Gully", role: "fielder" },
      { x: 120, y: 175, num: 5, name: "Point", role: "fielder" },
      { x: 148, y: 132, num: 6, name: "Mid-off", role: "fielder" },
      { x: 252, y: 132, num: 7, name: "Mid-on", role: "fielder" },
      { x: 80, y: 305, num: 8, name: "Third man", role: "fielder" },
      { x: 320, y: 305, num: 9, name: "Fine leg", role: "fielder" },
    ],
  },
  powerplay_spin_rhb: {
    name: "Spin in powerplay",
    inside: 6,
    outside: 3,
    text: "Attack the stumps. Short cover and short midwicket choke; deep midwicket and long-on protect the slog.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 270, y: 200, num: 3, name: "Point", role: "fielder" },
      { x: 245, y: 155, num: 4, name: "Short cover", role: "fielder" },
      { x: 155, y: 155, num: 5, name: "Short midwicket", role: "fielder" },
      { x: 130, y: 200, num: 6, name: "Square leg", role: "fielder" },
      { x: 70, y: 130, num: 7, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 60, num: 8, name: "Long-on", role: "fielder" },
      { x: 330, y: 130, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
  powerplay_spin_lhb: {
    name: "Spin in powerplay vs LHB",
    inside: 6,
    outside: 3,
    text: "Bowl into the stumps. Short cover and short midwicket choke singles.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 130, y: 200, num: 3, name: "Point", role: "fielder" },
      { x: 155, y: 155, num: 4, name: "Short cover", role: "fielder" },
      { x: 245, y: 155, num: 5, name: "Short midwicket", role: "fielder" },
      { x: 270, y: 200, num: 6, name: "Square leg", role: "fielder" },
      { x: 330, y: 130, num: 7, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 60, num: 8, name: "Long-on", role: "fielder" },
      { x: 70, y: 130, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
  middle_pace_rhb: {
    name: "Middle-overs squeeze",
    inside: 4,
    outside: 5,
    text: "Dot-ball pressure. Sweepers at deep point, deep cover, long-on, deep midwicket, fine leg. Bowl hard lengths.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 265, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 245, y: 155, num: 4, name: "Cover", role: "fielder" },
      { x: 155, y: 155, num: 5, name: "Mid-on", role: "fielder" },
      { x: 330, y: 220, num: 6, name: "Deep point", role: "fielder" },
      { x: 340, y: 110, num: 7, name: "Deep cover", role: "fielder" },
      { x: 60, y: 110, num: 8, name: "Deep midwicket", role: "fielder" },
      { x: 70, y: 290, num: 9, name: "Fine leg", role: "fielder" },
    ],
  },
  middle_pace_lhb: {
    name: "Middle squeeze vs LHB",
    inside: 4,
    outside: 5,
    text: "Mirrored sweepers. Bowl wide yorkers and back of length.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 135, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 155, y: 155, num: 4, name: "Cover", role: "fielder" },
      { x: 245, y: 155, num: 5, name: "Mid-on", role: "fielder" },
      { x: 70, y: 220, num: 6, name: "Deep point", role: "fielder" },
      { x: 60, y: 110, num: 7, name: "Deep cover", role: "fielder" },
      { x: 340, y: 110, num: 8, name: "Deep midwicket", role: "fielder" },
      { x: 330, y: 290, num: 9, name: "Fine leg", role: "fielder" },
    ],
  },
  middle_spin_rhb: {
    name: "Spin choke",
    inside: 4,
    outside: 5,
    text: "Boundary riders both sides. Attack the stumps; force the sweep into the long boundary.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 255, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 145, y: 195, num: 4, name: "Square leg", role: "fielder" },
      { x: 245, y: 145, num: 5, name: "Short cover", role: "fielder" },
      { x: 60, y: 130, num: 6, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 50, num: 7, name: "Long-on", role: "fielder" },
      { x: 290, y: 75, num: 8, name: "Long-off", role: "fielder" },
      { x: 340, y: 200, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
  middle_spin_lhb: {
    name: "Spin choke vs LHB",
    inside: 4,
    outside: 5,
    text: "Sweepers cover both sides. The slog-sweep is the trap.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 145, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 255, y: 195, num: 4, name: "Square leg", role: "fielder" },
      { x: 155, y: 145, num: 5, name: "Short cover", role: "fielder" },
      { x: 340, y: 130, num: 6, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 50, num: 7, name: "Long-on", role: "fielder" },
      { x: 110, y: 75, num: 8, name: "Long-off", role: "fielder" },
      { x: 60, y: 200, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
  death_pace_rhb: {
    name: "Death overs spread",
    inside: 4,
    outside: 5,
    text: "Five on the rope. Yorker plan — bowler aims at the base of the stumps.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 260, y: 175, num: 3, name: "Point", role: "fielder" },
      { x: 245, y: 220, num: 4, name: "Cover", role: "fielder" },
      { x: 235, y: 270, num: 5, name: "Fine leg", role: "fielder" },
      { x: 350, y: 165, num: 6, name: "Deep point", role: "fielder" },
      { x: 310, y: 60, num: 7, name: "Long-off", role: "fielder" },
      { x: 90, y: 60, num: 8, name: "Long-on", role: "fielder" },
      { x: 50, y: 165, num: 9, name: "Deep midwicket", role: "fielder" },
    ],
  },
  death_pace_lhb: {
    name: "Death overs vs LHB",
    inside: 4,
    outside: 5,
    text: "Wide yorker into the LHB. Mirrored ring; sweepers on both sides.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 140, y: 175, num: 3, name: "Point", role: "fielder" },
      { x: 155, y: 220, num: 4, name: "Cover", role: "fielder" },
      { x: 165, y: 270, num: 5, name: "Fine leg", role: "fielder" },
      { x: 50, y: 165, num: 6, name: "Deep point", role: "fielder" },
      { x: 90, y: 60, num: 7, name: "Long-off", role: "fielder" },
      { x: 310, y: 60, num: 8, name: "Long-on", role: "fielder" },
      { x: 350, y: 165, num: 9, name: "Deep midwicket", role: "fielder" },
    ],
  },
  death_spin_rhb: {
    name: "Death spin gamble",
    inside: 4,
    outside: 5,
    text: "Spinner at the death only with a favourable matchup. Boundary riders straight and square.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 215, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 255, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 145, y: 195, num: 4, name: "Square leg", role: "fielder" },
      { x: 245, y: 150, num: 5, name: "Short midwicket", role: "fielder" },
      { x: 60, y: 130, num: 6, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 50, num: 7, name: "Long-on", role: "fielder" },
      { x: 290, y: 75, num: 8, name: "Long-off", role: "fielder" },
      { x: 340, y: 200, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
  death_spin_lhb: {
    name: "Death spin vs LHB",
    inside: 4,
    outside: 5,
    text: "Bowl into the body. Reverse-sweep is the only release shot.",
    pos: [
      { x: 200, y: 145, num: 1, name: "Bowler", role: "bowler" },
      { x: 185, y: 235, num: 2, name: "Wicketkeeper", role: "keeper" },
      { x: 145, y: 195, num: 3, name: "Point", role: "fielder" },
      { x: 255, y: 195, num: 4, name: "Square leg", role: "fielder" },
      { x: 155, y: 150, num: 5, name: "Short midwicket", role: "fielder" },
      { x: 340, y: 130, num: 6, name: "Deep midwicket", role: "fielder" },
      { x: 200, y: 50, num: 7, name: "Long-on", role: "fielder" },
      { x: 110, y: 75, num: 8, name: "Long-off", role: "fielder" },
      { x: 60, y: 200, num: 9, name: "Deep cover", role: "fielder" },
    ],
  },
};

export default function FieldSetter() {
  const [phase, setPhase] = useState<Phase>("powerplay");
  const [bowler, setBowler] = useState<Bowler>("pace");
  const [batter, setBatter] = useState<Batter>("rhb");
  const [hovered, setHovered] = useState<Fielder | null>(null);

  const setup = useMemo<Setup>(() => {
    const key = `${phase}_${bucket(bowler)}_${batter}`;
    return SETUPS[key];
  }, [phase, bowler, batter]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
      {/* The pitch */}
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-auto w-full"
          role="img"
          aria-label={`Field placement for ${setup.name}`}
        >
          <defs>
            <radialGradient id="grass" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3F7821" />
              <stop offset="70%" stopColor="#2D5816" />
              <stop offset="100%" stopColor="#1E3D0E" />
            </radialGradient>
            <radialGradient id="infield" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4A8D27" />
              <stop offset="100%" stopColor="#3F7821" />
            </radialGradient>
          </defs>

          {/* Outfield, boundary, ring */}
          <circle
            cx={200}
            cy={200}
            r={188}
            fill="url(#grass)"
            stroke="#5C5C66"
            strokeWidth={1}
          />
          <circle
            cx={200}
            cy={200}
            r={188}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />
          <circle
            cx={200}
            cy={200}
            r={110}
            fill="url(#infield)"
            opacity={0.5}
          />
          <circle
            cx={200}
            cy={200}
            r={110}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1}
            strokeDasharray="5 4"
            opacity={0.65}
          />

          {/* Pitch */}
          <ellipse
            cx={200}
            cy={200}
            rx={28}
            ry={56}
            fill="#C9A876"
            opacity={0.55}
          />
          <rect
            x={193}
            y={170}
            width={14}
            height={60}
            fill="#D9BC8E"
            stroke="#7A5A3A"
            strokeWidth={0.5}
          />
          <line
            x1={193}
            y1={180}
            x2={207}
            y2={180}
            stroke="#7A5A3A"
            strokeWidth={0.5}
          />
          <line
            x1={193}
            y1={220}
            x2={207}
            y2={220}
            stroke="#7A5A3A"
            strokeWidth={0.5}
          />

          {/* Stumps as small marks */}
          <g stroke="#7A5A3A" strokeWidth={0.8}>
            <line x1={197} y1={172} x2={197} y2={178} />
            <line x1={200} y1={172} x2={200} y2={178} />
            <line x1={203} y1={172} x2={203} y2={178} />
            <line x1={197} y1={222} x2={197} y2={228} />
            <line x1={200} y1={222} x2={200} y2={228} />
            <line x1={203} y1={222} x2={203} y2={228} />
          </g>

          {/* Fielders */}
          {setup.pos.map((f) => {
            const color =
              f.role === "bowler"
                ? "#FF4D2E"
                : f.role === "keeper"
                  ? "#E53935"
                  : "#1976D2";
            return (
              <motion.g
                key={f.num}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: f.num * 0.04,
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                }}
                onMouseEnter={() => setHovered(f)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={f.x}
                  cy={f.y}
                  r={13}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <text
                  x={f.x}
                  y={f.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={500}
                  fill="#FFFFFF"
                  fontFamily="system-ui"
                >
                  {f.num}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-ink-400">
          <LegendDot color="#FF4D2E" label="Bowler" />
          <LegendDot color="#E53935" label="Keeper" />
          <LegendDot color="#1976D2" label="Fielder" />
        </div>
      </div>

      {/* Side panel */}
      <div className="space-y-3">
        <Selector
          label="Match phase"
          value={phase}
          onChange={(v) => setPhase(v as Phase)}
          options={[
            { v: "powerplay", t: "Powerplay (1-6)" },
            { v: "middle", t: "Middle (7-15)" },
            { v: "death", t: "Death (16-20)" },
          ]}
        />
        <Selector
          label="Bowler type"
          value={bowler}
          onChange={(v) => setBowler(v as Bowler)}
          options={[
            { v: "pace", t: "Right-arm pace" },
            { v: "lpace", t: "Left-arm pace" },
            { v: "offspin", t: "Off-spin" },
            { v: "legspin", t: "Leg-spin" },
          ]}
        />
        <Selector
          label="Batter"
          value={batter}
          onChange={(v) => setBatter(v as Batter)}
          options={[
            { v: "rhb", t: "Right-hand bat" },
            { v: "lhb", t: "Left-hand bat" },
          ]}
        />

        <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
          <div className="text-xs uppercase tracking-widest text-ink-500">
            Setup
          </div>
          <div className="mt-1 text-base font-medium text-ink-100">
            {setup.name}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Inside circle" value={setup.inside} />
            <Stat label="Outside" value={setup.outside} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-300">
            {setup.text}
          </p>

          {/* Numbered fielder list */}
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {setup.pos.map((f) => (
              <div
                key={f.num}
                className={`flex items-center gap-2 transition ${
                  hovered?.num === f.num ? "text-ink-50" : "text-ink-400"
                }`}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{
                    background:
                      f.role === "bowler"
                        ? "#FF4D2E"
                        : f.role === "keeper"
                          ? "#E53935"
                          : "#1976D2",
                  }}
                >
                  {f.num}
                </span>
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; t: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-ink-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-ink-800 px-3 py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-lg font-medium text-ink-100">{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
