"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Logo from "../components/Logo";
import TeamCrest from "../components/TeamCrest";
import { useAuth } from "../context/AuthProvider";
import { api, ApiError } from "../lib/api";
import { IPL_BRANDS, type IplTeam } from "../lib/types";

type Step = 0 | 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<IplTeam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<IplTeam[]>("/api/auth/ipl-teams")
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

  const canNext = (() => {
    switch (step) {
      case 0:
        return name.trim().length >= 2;
      case 1:
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      case 2:
        return password.length >= 8;
      case 3:
        return /^\d{4}-\d{2}-\d{2}$/.test(dob);
      case 4:
        return teamId !== null;
      default:
        return false;
    }
  })();

  const next = () => {
    setError(null);
    if (step < 4) setStep((step + 1) as Step);
    else void onSubmit();
  };

  const back = () => {
    setError(null);
    if (step > 0) setStep((step - 1) as Step);
  };

  const onSubmit = async () => {
    if (!teamId) return;
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        dob,
        favorite_team_id: teamId,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong");
      setSubmitting(false);
    }
  };

  // Submit on Enter at any text step
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canNext && !submitting) {
      e.preventDefault();
      next();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 flex justify-center">
        <Logo size={36} />
      </div>

      {/* Progress bar */}
      <div className="mb-10 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-ink-500">
          <span>Step {step + 1} of 5</span>
          <a href="/login" className="hover:text-ink-300">
            Have an account? Sign in
          </a>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink-800">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${((step + 1) / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
          />
        </div>
      </div>

      <div className="w-full max-w-md" onKeyDown={onKeyDown}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            {step === 0 && (
              <StepShell
                title="What should we call you?"
                hint="Use your real name or a nickname."
              >
                <Input
                  autoFocus
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </StepShell>
            )}
            {step === 1 && (
              <StepShell
                title="What's your email?"
                hint="We'll use it to sign you in."
              >
                <Input
                  autoFocus
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </StepShell>
            )}
            {step === 2 && (
              <StepShell
                title="Set a password"
                hint="At least 8 characters. Make it strong."
              >
                <Input
                  autoFocus
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrength value={password} />
              </StepShell>
            )}
            {step === 3 && (
              <StepShell
                title="When were you born?"
                hint="So we can wish you on the right day."
              >
                <Input
                  autoFocus
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </StepShell>
            )}
            {step === 4 && (
              <StepShell
                title="Pick your IPL team"
                hint="You can change this once during the season."
              >
                <TeamPicker teams={teams} value={teamId} onChange={setTeamId} />
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {error}
          </motion.p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="rounded-full border border-ink-700 px-5 py-2.5 text-sm text-ink-300 transition hover:border-ink-600 hover:text-ink-100 disabled:opacity-30"
          >
            Back
          </button>
          <button
            onClick={next}
            disabled={!canNext || submitting}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-glow active:scale-95 disabled:opacity-40"
            style={{ boxShadow: "0 8px 30px rgba(255, 77, 46, 0.25)" }}
          >
            {step === 4
              ? submitting
                ? "Creating…"
                : "Create account"
              : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-ink-100">{title}</h1>
      {hint && <p className="mt-1 text-sm text-ink-400">{hint}</p>}
      <div className="mt-6 space-y-3">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
    />
  );
}

function PasswordStrength({ value }: { value: string }) {
  const score =
    (value.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/[0-9]/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(value) ? 1 : 0);
  const labels = ["Too short", "Weak", "OK", "Good", "Strong"];
  const colors = ["#5C5C66", "#FF5060", "#FFA040", "#3DD68C", "#3DD68C"];
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            animate={{ background: i < score ? colors[score] : "#26262B" }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <span className="text-xs text-ink-500" style={{ minWidth: 70 }}>
        {value ? labels[score] : ""}
      </span>
    </div>
  );
}

// ----- Team picker grid -----------------------------------------------------

function TeamPicker({
  teams,
  value,
  onChange,
}: {
  teams: IplTeam[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (teams.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-ink-800"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {teams.map((t) => {
        const brand = IPL_BRANDS[t.id];
        const selected = value === t.id;
        return (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 transition ${
              selected ? "border-accent" : "border-ink-700 hover:border-ink-600"
            }`}
            style={{
              background: selected
                ? `linear-gradient(180deg, ${brand?.primary}33, ${brand?.primary}10)`
                : "#111113",
              boxShadow: selected ? `0 0 30px ${brand?.primary}40` : undefined,
            }}
          >
            <TeamCrest teamId={t.id} size={48} ring={false} />
            <span className="text-xs font-medium text-ink-100 leading-tight text-center px-1">
              {brand?.short ?? t.name}
            </span>
            {selected && (
              <motion.div
                layoutId="team-check"
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
