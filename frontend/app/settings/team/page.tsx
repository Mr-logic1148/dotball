"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Logo from "../../components/Logo";
import TeamCrest from "../../components/TeamCrest";
import { useAuth } from "../../context/AuthProvider";
import { api, ApiError } from "../../lib/api";
import { IPL_BRANDS, type IplTeam } from "../../lib/types";

export default function ChangeTeamPage() {
  const { user, loading, changeTeam } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<IplTeam[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    api<IplTeam[]>("/api/auth/ipl-teams")
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

  if (loading || !user) return null;

  const onSave = async () => {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      await changeTeam(picked);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't change team");
      setSubmitting(false);
    }
  };

  const alreadyChanged = user.team_changed_this_season;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <div className="mb-10 flex items-center justify-between">
        <Logo size={32} />
        <a href="/" className="text-sm text-ink-400 hover:text-ink-100">
          ← Back
        </a>
      </div>

      <h1 className="text-2xl font-medium text-ink-100">Your IPL team</h1>
      <p className="mt-1 text-sm text-ink-400">
        You can change your team once per season.
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-ink-700 bg-ink-900 p-4">
        {user.favorite_team && (
          <>
            <TeamCrest teamId={user.favorite_team.id} size={48} />
            <div>
              <p className="text-sm text-ink-400">Currently supporting</p>
              <p className="text-base font-medium text-ink-100">
                {user.favorite_team.name}
              </p>
            </div>
          </>
        )}
      </div>

      {alreadyChanged ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-ink-700 bg-ink-900/60 p-6 text-center"
        >
          <p className="text-sm text-ink-300">
            You've already used your team change this season. You can switch
            again next season.
          </p>
        </motion.div>
      ) : (
        <>
          <p className="mb-3 mt-8 text-sm uppercase tracking-widest text-ink-500">
            Switch to
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {teams
              .filter((t) => t.id !== user.favorite_team?.id)
              .map((t) => {
                const brand = IPL_BRANDS[t.id];
                const selected = picked === t.id;
                return (
                  <motion.button
                    key={t.id}
                    onClick={() => setPicked(t.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 transition ${
                      selected
                        ? "border-accent"
                        : "border-ink-700 hover:border-ink-600"
                    }`}
                    style={{
                      background: selected
                        ? `linear-gradient(180deg, ${brand?.primary}33, ${brand?.primary}10)`
                        : "#111113",
                      boxShadow: selected
                        ? `0 0 30px ${brand?.primary}40`
                        : undefined,
                    }}
                  >
                    <TeamCrest teamId={t.id} size={48} ring={false} />
                    <span className="text-xs font-medium text-ink-100 leading-tight text-center px-1">
                      {brand?.short ?? t.name}
                    </span>
                  </motion.button>
                );
              })}
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-ink-700 px-5 py-2.5 text-sm text-ink-300 transition hover:border-ink-600 hover:text-ink-100"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!picked || submitting}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-glow active:scale-95 disabled:opacity-40"
              style={{ boxShadow: "0 8px 30px rgba(255, 77, 46, 0.25)" }}
            >
              {submitting ? "Saving…" : "Confirm change"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
