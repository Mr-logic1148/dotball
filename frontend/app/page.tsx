"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import Logo from "./components/Logo";
import TodayCard from "./components/TodayCard";
import { useAuth } from "./context/AuthProvider";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Logo size={48} />
        </motion.div>
      </main>
    );
  }

  if (!user) {
    return (
      <LandingLoggedOut
        onSignIn={() => router.push("./login")}
        onCreate={() => router.push("./register")}
      />
    );
  }

  return <LandingLoggedIn name={user.name} onLogout={() => logout()} />;
}

// ----- Logged-out: Google-minimal --------------------------------------------

function LandingLoggedOut({
  onSignIn,
  onCreate,
}: {
  onSignIn: () => void;
  onCreate: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="flex flex-col items-center"
      >
        <Logo size={72} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-sm uppercase tracking-[0.3em] text-ink-500"
        >
          Pressure, ball by ball.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.45,
            type: "spring",
            stiffness: 180,
            damping: 22,
          }}
          className="mt-12 flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={onCreate}
            className="rounded-full bg-accent px-8 py-3 text-sm font-medium text-white transition hover:bg-accent-glow active:scale-95"
            style={{ boxShadow: "0 8px 30px rgba(255, 77, 46, 0.35)" }}
          >
            Create account
          </button>
          <button
            onClick={onSignIn}
            className="rounded-full border border-ink-700 bg-ink-900 px-8 py-3 text-sm font-medium text-ink-200 transition hover:border-ink-600 hover:bg-ink-800 active:scale-95"
          >
            Sign in
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}

// ----- Logged-in: today-focused ----------------------------------------------

function LandingLoggedIn({
  name,
  onLogout,
}: {
  name: string;
  onLogout: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      {/* Top bar */}
      <div className="mb-12 flex items-center justify-between">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-400 sm:inline">
            Hi, {name.split(" ")[0]}
          </span>
          <button
            onClick={onLogout}
            className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-ink-300 transition hover:border-ink-600 hover:text-ink-100"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Today widget */}
      <section className="flex-1">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-ink-500">
          Today
        </p>
        <TodayCard />
      </section>

      {/* Footer nav */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-10 flex flex-wrap gap-2"
      >
        <FooterLink href="/field-setter" label="Field setter" />
        <FooterLink href="/wagon-wheel" label="Wagon wheel" />
        <FooterLink href="/settings/team" label="Change team" />
      </motion.nav>
    </main>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-full border border-ink-700 bg-ink-900/60 px-4 py-2 text-xs text-ink-300 transition hover:border-ink-600 hover:bg-ink-800 hover:text-ink-100"
    >
      {label}
    </a>
  );
}
