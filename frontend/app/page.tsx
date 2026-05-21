import FieldSetter from "./components/FieldSetter";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-ball-600" aria-hidden />
          <span className="text-2xl font-semibold tracking-tight">DotBall</span>
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          Pressure, ball by ball.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-pitch-900/70">
          The T20 strategy platform for captains, players, coaches, and
          analysts. Set fields, plan matchups, scout opponents, and read the
          game live.
        </p>
        <nav className="mt-6 flex gap-3 text-sm">
          <a
            href="/wagon-wheel"
            className="rounded-md bg-pitch-900 px-3 py-1.5 text-white hover:bg-pitch-600"
          >
            Wagon wheel &rarr;
          </a>
        </nav>
      </header>

      <section
        aria-labelledby="field-setter"
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pitch-900/10"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="field-setter" className="text-xl font-semibold">
            Field setter
          </h2>
          <span className="text-xs text-pitch-900/60">Hero feature · v0.1</span>
        </div>
        <FieldSetter />
      </section>

      <footer className="mt-10 text-sm text-pitch-900/60">
        Built with Next.js + FastAPI · Data: Cricsheet · MIT licensed
      </footer>
    </main>
  );
}
