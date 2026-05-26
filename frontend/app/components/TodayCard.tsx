"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { IPL_BRANDS, type TodayMatch } from "../lib/types";

import TeamCrest from "./TeamCrest";

export default function TodayCard() {
  const [data, setData] = useState<TodayMatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<TodayMatch>("/api/today/")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // Trigger confetti when status flips to "won".
  useEffect(() => {
    if (data?.status !== "won") return;
    const brand = IPL_BRANDS[data.user_team_id];
    const colors = brand
      ? [brand.primary, brand.secondary, "#FFD700", "#FFFFFF"]
      : ["#FF4D2E", "#3DD68C", "#FFD700", "#FFFFFF"];
    const fire = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 45,
        origin,
        colors,
        scalar: 0.9,
        ticks: 200,
      });
    const t1 = setTimeout(() => fire({ x: 0.2, y: 0.6 }), 150);
    const t2 = setTimeout(() => fire({ x: 0.8, y: 0.6 }), 350);
    const t3 = setTimeout(() => fire({ x: 0.5, y: 0.4 }), 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [data?.status, data?.user_team_id]);

  if (error) {
    return (
      <Surface>
        <p className="text-center text-sm text-ink-400">
          Couldn't load today's match. Check that the backend is running.
        </p>
      </Surface>
    );
  }

  if (!data) {
    return (
      <Surface>
        <div className="h-32 animate-pulse rounded-lg bg-ink-800" />
      </Surface>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={data.status}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        {data.status === "won" && <WonCard data={data} />}
        {data.status === "lost" && <LostCard data={data} />}
        {data.status === "live" && <LiveCard data={data} />}
        {data.status === "upcoming" && <UpcomingCard data={data} />}
        {data.status === "no_match" && <NoMatchCard data={data} />}
        {data.status === "tied" && <TiedCard data={data} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Surface({
  children,
  glow,
}: {
  children: React.ReactNode;
  glow?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-8 shadow-2xl"
      style={
        glow
          ? { boxShadow: `0 0 80px -10px ${glow}40, 0 0 0 1px ${glow}20` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/60 px-3 py-1 text-xs text-ink-300">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </div>
  );
}

function ScoreLine({
  teamId,
  teamName,
  score,
  emphasis,
}: {
  teamId: string;
  teamName: string;
  score: string | null;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <TeamCrest teamId={teamId} size={40} ring={false} />
        <span
          className={`text-sm ${emphasis ? "font-medium text-ink-100" : "text-ink-300"}`}
        >
          {teamName}
        </span>
      </div>
      <span
        className={`font-mono text-lg tabular-nums ${emphasis ? "text-ink-100" : "text-ink-300"}`}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

// ----- Per-status cards ------------------------------------------------------

function WonCard({ data }: { data: TodayMatch }) {
  const brand = IPL_BRANDS[data.user_team_id];
  return (
    <Surface glow={brand?.primary}>
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          <TeamCrest teamId={data.user_team_id} size={88} />
        </motion.div>
        <motion.h2
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 240,
            damping: 22,
          }}
          className="mt-5 text-3xl font-medium tracking-tight text-ink-50 md:text-4xl"
        >
          {data.user_team_name} win!
        </motion.h2>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-2 text-sm uppercase tracking-widest text-ink-400"
        >
          {data.result_summary ?? "Victory"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 w-full max-w-sm space-y-3 rounded-2xl border border-ink-700 bg-ink-950/40 p-4"
        >
          <ScoreLine
            teamId={data.user_team_id}
            teamName={data.user_team_name}
            score={data.user_team_score}
            emphasis
          />
          <div className="h-px bg-ink-700" />
          <ScoreLine
            teamId={data.opponent_team_id ?? ""}
            teamName={data.opponent_team_name ?? "Opponent"}
            score={data.opponent_score}
          />
        </motion.div>
        {data.venue && (
          <p className="mt-4 text-xs text-ink-500">{data.venue}</p>
        )}
      </div>
    </Surface>
  );
}

function LostCard({ data }: { data: TodayMatch }) {
  return (
    <Surface>
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <TeamCrest teamId={data.user_team_id} size={72} />
        </motion.div>
        <motion.h2
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-5 text-3xl font-medium tracking-tight text-ink-100 md:text-4xl"
        >
          Well played.
        </motion.h2>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-2 max-w-md text-sm text-ink-400"
        >
          {data.user_team_name} fell short today — {data.result_summary ?? ""}.
          Better luck next time.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 w-full max-w-sm space-y-3 rounded-2xl border border-ink-700 bg-ink-950/40 p-4"
        >
          <ScoreLine
            teamId={data.user_team_id}
            teamName={data.user_team_name}
            score={data.user_team_score}
          />
          <div className="h-px bg-ink-700" />
          <ScoreLine
            teamId={data.opponent_team_id ?? ""}
            teamName={data.opponent_team_name ?? "Opponent"}
            score={data.opponent_score}
            emphasis
          />
        </motion.div>
      </div>
    </Surface>
  );
}

function LiveCard({ data }: { data: TodayMatch }) {
  return (
    <Surface glow="#3DD68C">
      <div className="mb-5 flex items-center justify-between">
        <StatusBadge label="Live" color="#3DD68C" />
        {data.venue && (
          <span className="text-xs text-ink-500">{data.venue}</span>
        )}
      </div>
      <h2 className="mb-5 text-lg font-medium text-ink-100">{data.message}</h2>
      <div className="space-y-3 rounded-2xl border border-ink-700 bg-ink-950/40 p-4">
        <ScoreLine
          teamId={data.user_team_id}
          teamName={data.user_team_name}
          score={data.user_team_score}
          emphasis
        />
        <div className="h-px bg-ink-700" />
        <ScoreLine
          teamId={data.opponent_team_id ?? ""}
          teamName={data.opponent_team_name ?? "Opponent"}
          score={data.opponent_score}
        />
      </div>
    </Surface>
  );
}

function UpcomingCard({ data }: { data: TodayMatch }) {
  const time = data.start_time
    ? new Date(data.start_time).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  return (
    <Surface>
      <div className="mb-4 flex items-center justify-between">
        <StatusBadge label="Today" color="#FF4D2E" />
        {time && (
          <span className="text-sm text-ink-300">First ball · {time}</span>
        )}
      </div>
      <h2 className="mb-6 text-2xl font-medium text-ink-100 md:text-3xl">
        {data.user_team_name} vs {data.opponent_team_name}
      </h2>
      <div className="flex items-center justify-center gap-8">
        <TeamCrest teamId={data.user_team_id} size={72} />
        <span className="text-2xl font-light text-ink-500">vs</span>
        <TeamCrest teamId={data.opponent_team_id ?? ""} size={72} />
      </div>
      {data.venue && (
        <p className="mt-6 text-center text-xs text-ink-500">{data.venue}</p>
      )}
    </Surface>
  );
}

function NoMatchCard({ data }: { data: TodayMatch }) {
  return (
    <Surface>
      <div className="flex flex-col items-center text-center">
        <TeamCrest teamId={data.user_team_id} size={56} />
        <h2 className="mt-4 text-xl font-medium text-ink-100">
          No match today for {data.user_team_name}.
        </h2>
        <p className="mt-2 text-sm text-ink-400">
          Check back tomorrow, or explore the platform below.
        </p>
      </div>
    </Surface>
  );
}

function TiedCard({ data }: { data: TodayMatch }) {
  return (
    <Surface>
      <div className="text-center">
        <h2 className="text-3xl font-medium text-ink-100">Tied!</h2>
        <p className="mt-2 text-sm text-ink-400">
          A nail-biter — {data.user_team_name} and {data.opponent_team_name}{" "}
          couldn't be separated.
        </p>
      </div>
    </Surface>
  );
}
