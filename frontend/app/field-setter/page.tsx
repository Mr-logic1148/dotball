"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import FieldSetter from "../components/FieldSetter";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthProvider";

export default function FieldSetterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Logo size={32} />
        <a href="/" className="text-sm text-ink-400 hover:text-ink-100">
          ← Back
        </a>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-ink-100">
          Field setter
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Pick a phase, bowler type, and batter to see the recommended setup.
        </p>
      </header>

      <section className="rounded-3xl border border-ink-700 bg-ink-900/50 p-6">
        <FieldSetter />
      </section>
    </main>
  );
}
