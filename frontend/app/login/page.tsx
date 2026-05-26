"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Logo from "../components/Logo";
import { useAuth } from "../context/AuthProvider";
import { ApiError } from "../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 flex justify-center">
          <Logo size={44} />
        </div>

        <h1 className="mb-1 text-center text-2xl font-medium text-ink-100">
          Welcome back
        </h1>
        <p className="mb-8 text-center text-sm text-ink-400">
          Sign in to continue.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-glow active:scale-95 disabled:opacity-50"
            style={{ boxShadow: "0 8px 30px rgba(255, 77, 46, 0.25)" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          New here?{" "}
          <a
            href="/register"
            className="text-ink-100 underline-offset-4 hover:underline"
          >
            Create an account
          </a>
        </p>
      </motion.div>
    </main>
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
