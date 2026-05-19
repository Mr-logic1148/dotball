"use client";
import { useMemo, useState } from "react";

type Phase = "powerplay" | "middle" | "death";
type Bowler = "pace" | "lpace" | "offspin" | "legspin";
type Batter = "rhb" | "lhb";

type Fielder = { x: number; y: number; label: string };
type Setup = {
  name: string;
  inside: number;
  outside: number;
  text: string;
  pos: Fielder[];
};

// Bucket spin types together for now; differentiate later as data fills in.
const bucket = (b: Bowler): "pace" | "spin" =>
  b === "pace" || b === "lpace" ? "pace" : "spin";

// Preset library: 12 setups covering 3 phases x 2 bowler buckets x 2 batter types.
// Coordinates are on a 360x360 SVG with stumps at (180, 180) and a 170-radius boundary.
const SETUPS: Record<string, Setup> = {
  powerplay_pace_rhb: {
    name: "Attacking powerplay",
    inside: 7,
    outside: 2,
    text: "Two slips, gully, point in the ring. Mid-off and mid-on up. Fine leg and third man are the only sweepers — force the false shot.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 225, y: 140, label: "SLP" },
      { x: 245, y: 155, label: "GLY" },
      { x: 260, y: 200, label: "PNT" },
      { x: 230, y: 250, label: "COV" },
      { x: 150, y: 250, label: "MDO" },
      { x: 110, y: 210, label: "MDW" },
      { x: 120, y: 90, label: "TM" },
      { x: 270, y: 90, label: "FL" },
    ],
  },
  powerplay_pace_lhb: {
    name: "Attacking powerplay vs LHB",
    inside: 7,
    outside: 2,
    text: "Mirror the field: slip and gully on the LHB off side. Pack the off side; bowl fourth-stump line and induce the drive.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 135, y: 140, label: "SLP" },
      { x: 115, y: 155, label: "GLY" },
      { x: 100, y: 200, label: "PNT" },
      { x: 130, y: 250, label: "COV" },
      { x: 210, y: 250, label: "MDO" },
      { x: 250, y: 210, label: "MDW" },
      { x: 240, y: 90, label: "TM" },
      { x: 90, y: 90, label: "FL" },
    ],
  },
  powerplay_spin_rhb: {
    name: "Spin in powerplay",
    inside: 6,
    outside: 3,
    text: "Slip in, short cover, short midwicket. Deep midwicket and long-on protect the slog. Attack the stumps, tempt the lofted hit.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 220, y: 135, label: "SLP" },
      { x: 245, y: 210, label: "PNT" },
      { x: 210, y: 235, label: "SCV" },
      { x: 145, y: 235, label: "SMW" },
      { x: 125, y: 205, label: "MDW" },
      { x: 180, y: 300, label: "LON" },
      { x: 80, y: 260, label: "DMW" },
      { x: 280, y: 90, label: "TM" },
    ],
  },
  powerplay_spin_lhb: {
    name: "Spin in powerplay vs LHB",
    inside: 6,
    outside: 3,
    text: "Bowl into the stumps. Short cover and short midwicket choke singles; deep cover and long-on guard the hit zones.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 140, y: 135, label: "SLP" },
      { x: 115, y: 210, label: "PNT" },
      { x: 150, y: 235, label: "SCV" },
      { x: 215, y: 235, label: "SMW" },
      { x: 235, y: 205, label: "MDW" },
      { x: 180, y: 300, label: "LON" },
      { x: 280, y: 260, label: "DCV" },
      { x: 80, y: 90, label: "TM" },
    ],
  },
  middle_pace_rhb: {
    name: "Middle-overs squeeze",
    inside: 4,
    outside: 5,
    text: "Dot-ball pressure: deep point, deep cover, long-on, deep midwicket, fine leg out. In-ring saves singles. Bowl hard lengths.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 250, y: 170, label: "PNT" },
      { x: 230, y: 255, label: "COV" },
      { x: 130, y: 255, label: "MDO" },
      { x: 110, y: 170, label: "MDW" },
      { x: 290, y: 230, label: "DPT" },
      { x: 60, y: 250, label: "DCV" },
      { x: 60, y: 90, label: "DMW" },
      { x: 300, y: 90, label: "FL" },
    ],
  },
  middle_pace_lhb: {
    name: "Middle squeeze vs LHB",
    inside: 4,
    outside: 5,
    text: "Mirrored sweepers. Bowl wide yorkers and back-of-length. Two on each side of the boundary, ring saves the single.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 110, y: 170, label: "PNT" },
      { x: 130, y: 255, label: "COV" },
      { x: 230, y: 255, label: "MDO" },
      { x: 250, y: 170, label: "MDW" },
      { x: 70, y: 230, label: "DPT" },
      { x: 300, y: 250, label: "DCV" },
      { x: 300, y: 90, label: "DMW" },
      { x: 60, y: 90, label: "FL" },
    ],
  },
  middle_spin_rhb: {
    name: "Spin choke",
    inside: 4,
    outside: 5,
    text: "Boundary riders at deep midwicket, long-on, long-off, deep cover, deep point. Bowler attacks the stumps; force the sweep into the long boundary.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 225, y: 200, label: "PNT" },
      { x: 150, y: 220, label: "SMW" },
      { x: 125, y: 160, label: "NSL" },
      { x: 210, y: 160, label: "SHM" },
      { x: 70, y: 250, label: "DMW" },
      { x: 180, y: 320, label: "LON" },
      { x: 180, y: 55, label: "LOF" },
      { x: 290, y: 250, label: "DCV" },
    ],
  },
  middle_spin_lhb: {
    name: "Spin choke vs LHB",
    inside: 4,
    outside: 5,
    text: "Sweepers cover both sides. Drift in, dip out. The slog-sweep is the trap — deep midwicket on the LHB side stays squarer.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 135, y: 200, label: "PNT" },
      { x: 210, y: 220, label: "SMW" },
      { x: 235, y: 160, label: "NSL" },
      { x: 150, y: 160, label: "SHM" },
      { x: 290, y: 250, label: "DMW" },
      { x: 180, y: 320, label: "LON" },
      { x: 180, y: 55, label: "LOF" },
      { x: 70, y: 250, label: "DCV" },
    ],
  },
  death_pace_rhb: {
    name: "Death overs spread",
    inside: 4,
    outside: 5,
    text: "Five on the rope. Yorker plan: deep point, deep cover, long-off, long-on, deep midwicket. Fine leg in. Bowler aims at base of stumps.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 230, y: 150, label: "PNT" },
      { x: 215, y: 225, label: "COV" },
      { x: 145, y: 225, label: "MDO" },
      { x: 225, y: 80, label: "FL" },
      { x: 300, y: 210, label: "DPT" },
      { x: 270, y: 290, label: "DCV" },
      { x: 180, y: 55, label: "LOF" },
      { x: 70, y: 290, label: "DMW" },
    ],
  },
  death_pace_lhb: {
    name: "Death overs vs LHB",
    inside: 4,
    outside: 5,
    text: "Wide yorker into the LHB. Mirrored ring; sweepers on both sides; long-on slightly straighter to cut off the flick over square.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 130, y: 150, label: "PNT" },
      { x: 145, y: 225, label: "COV" },
      { x: 215, y: 225, label: "MDO" },
      { x: 135, y: 80, label: "FL" },
      { x: 60, y: 210, label: "DPT" },
      { x: 90, y: 290, label: "DCV" },
      { x: 180, y: 55, label: "LOF" },
      { x: 290, y: 290, label: "DMW" },
    ],
  },
  death_spin_rhb: {
    name: "Death spin gamble",
    inside: 4,
    outside: 5,
    text: "Spinner at the death only if the matchup is in your favour. All boundary riders straight and square. Bowl wide of off, deny the arc.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 225, y: 200, label: "PNT" },
      { x: 155, y: 225, label: "SMW" },
      { x: 210, y: 150, label: "SHM" },
      { x: 225, y: 75, label: "TM" },
      { x: 60, y: 250, label: "DMW" },
      { x: 180, y: 320, label: "LON" },
      { x: 180, y: 55, label: "LOF" },
      { x: 300, y: 250, label: "DCV" },
    ],
  },
  death_spin_lhb: {
    name: "Death spin vs LHB",
    inside: 4,
    outside: 5,
    text: "Bowl into the body and target the long boundary. The reverse-sweep is the only release shot — keep deep point honest.",
    pos: [
      { x: 180, y: 90, label: "BWL" },
      { x: 135, y: 200, label: "PNT" },
      { x: 205, y: 225, label: "SMW" },
      { x: 150, y: 150, label: "SHM" },
      { x: 135, y: 75, label: "TM" },
      { x: 300, y: 250, label: "DMW" },
      { x: 180, y: 320, label: "LON" },
      { x: 180, y: 55, label: "LOF" },
      { x: 60, y: 250, label: "DCV" },
    ],
  },
};

export default function FieldSetter() {
  const [phase, setPhase] = useState<Phase>("powerplay");
  const [bowler, setBowler] = useState<Bowler>("pace");
  const [batter, setBatter] = useState<Batter>("rhb");

  const setup = useMemo<Setup>(() => {
    const key = `${phase}_${bucket(bowler)}_${batter}`;
    return SETUPS[key];
  }, [phase, bowler, batter]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl bg-pitch-50 p-3">
        <svg
          viewBox="0 0 360 360"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-auto w-full"
          role="img"
          aria-label={`Field placement for ${setup.name}`}
        >
          <circle cx="180" cy="180" r="170" fill="#97C459" stroke="#639922" />
          <circle
            cx="180"
            cy="180"
            r="105"
            fill="none"
            stroke="#fff"
            strokeDasharray="4 3"
            opacity={0.8}
          />
          <circle cx="180" cy="180" r="45" fill="#C0DD97" opacity={0.6} />
          <rect
            x="172"
            y="155"
            width="16"
            height="50"
            fill="#FAEEDA"
            stroke="#BA7517"
          />
          {setup.pos.map((f, i) => {
            const isBowler = f.label === "BWL";
            return (
              <g key={i}>
                <circle
                  cx={f.x}
                  cy={f.y}
                  r={11}
                  fill={isBowler ? "#993C1D" : "#185FA5"}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
                <text
                  x={f.x}
                  y={f.y + 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={500}
                  fill="#fff"
                >
                  {f.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex justify-between px-1 text-xs text-pitch-900/60">
          <span>Fine leg side</span>
          <span>{batter === "rhb" ? "RHB batting ↑" : "LHB batting ↑"}</span>
          <span>Off side</span>
        </div>
      </div>

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

        <div className="rounded-xl bg-white p-4 ring-1 ring-pitch-900/10">
          <div className="text-xs text-pitch-900/60">Setup</div>
          <div className="text-base font-medium">{setup.name}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Inside circle" value={setup.inside} />
            <Stat label="Outside" value={setup.outside} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-pitch-900/80">
            {setup.text}
          </p>
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
      <span className="mb-1 block text-xs text-pitch-900/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-pitch-900/15 bg-white px-3 py-2 text-sm"
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
    <div className="rounded-md bg-pitch-50 px-3 py-2">
      <div className="text-xs text-pitch-900/60">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}
