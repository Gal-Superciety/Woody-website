'use client';

import { useMemo, useState } from 'react';

const demoOutcomes = [
  { label: 'Try again', points: 1, accent: 'text-slate-200', glow: 'from-slate-500/30 to-slate-700/30' },
  { label: 'Small WOODY reward', points: 5, accent: 'text-orange-300', glow: 'from-orange-500/30 to-orange-700/30' },
  { label: 'Lucky WOODY reward', points: 20, accent: 'text-sky-300', glow: 'from-sky-500/30 to-sky-700/30' },
  { label: 'Jackpot visual only', points: 100, accent: 'text-emerald-300', glow: 'from-emerald-500/30 to-emerald-700/30' },
];

const weeklyLeaderboard = [
  { name: 'WoodyRanger', points: 280 },
  { name: 'NeonHowl', points: 210 },
  { name: 'MemePilot', points: 175 },
  { name: 'PixelWoody', points: 132 },
];

const monthlyLeaderboard = [
  { name: 'GalaxyBark', points: 890 },
  { name: 'ChainVoyager', points: 740 },
  { name: 'EchoWoody', points: 688 },
  { name: 'MoonPaws', points: 602 },
];

export default function SpinPage() {
  const [result, setResult] = useState(demoOutcomes[0]);
  const [spins, setSpins] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const onSpin = () => {
    const randomIndex = Math.floor(Math.random() * demoOutcomes.length);
    const outcome = demoOutcomes[randomIndex];
    setResult(outcome);
    setSpins((prev) => prev + 1);
    setTotalPoints((prev) => prev + outcome.points);
  };

  const demoAverage = useMemo(() => (spins ? (totalPoints / spins).toFixed(1) : '0.0'), [spins, totalPoints]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8">
      <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
        <h1 className="text-3xl font-bold tracking-wide text-orange-300 md:text-5xl">WOODY Spin</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">A playful community mini-game concept for the WOODY ecosystem.</p>
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">Demo mode: no real payments or rewards yet.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-3xl border border-sky-400/20 bg-card/80 p-6 shadow-[0_0_50px_rgba(56,189,248,0.12)]">
          <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#020b1d] p-6 md:min-h-[420px]">
            <div className="absolute -left-12 top-1/3 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -right-12 top-1/4 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute bottom-0 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className={`relative w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-br ${result.glow} p-8 text-center shadow-[0_0_35px_rgba(14,165,233,0.22)]`}>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">Current Demo Result</p>
              <p className={`mt-4 text-2xl font-bold md:text-3xl ${result.accent}`}>{result.label}</p>
              <p className="mt-3 text-sm text-white/75">Points earned this spin: <span className="font-semibold text-white">{result.points}</span></p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={onSpin}
              className="rounded-xl border border-orange-300/30 bg-orange-400/20 px-8 py-3 font-semibold tracking-wide text-orange-100 transition hover:scale-[1.01] hover:bg-orange-400/30"
            >
              Spin Demo
            </button>
            <div className="grid grid-cols-3 gap-3 text-sm text-white/80">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><p className="text-xs text-white/55">Spins</p><p className="font-semibold">{spins}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><p className="text-xs text-white/55">Total Points</p><p className="font-semibold text-emerald-300">{totalPoints}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><p className="text-xs text-white/55">Avg / Spin</p><p className="font-semibold text-sky-300">{demoAverage}</p></div>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card/80 p-5">
            <h2 className="text-lg font-semibold text-orange-200">Point Rules</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {demoOutcomes.map((entry) => (
                <li key={entry.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span>{entry.label}</span>
                  <span className="font-semibold text-emerald-300">{entry.points}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-orange-400/20 bg-card/80 p-5">
          <h2 className="text-xl font-semibold text-orange-200">Weekly Leaderboard</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {weeklyLeaderboard.map((entry, index) => (
              <li key={entry.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/85">
                <span><span className="mr-2 text-orange-300">#{index + 1}</span>{entry.name}</span>
                <span className="font-semibold text-emerald-300">{entry.points} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-sky-400/20 bg-card/80 p-5">
          <h2 className="text-xl font-semibold text-sky-200">Monthly Leaderboard</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {monthlyLeaderboard.map((entry, index) => (
              <li key={entry.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/85">
                <span><span className="mr-2 text-sky-300">#{index + 1}</span>{entry.name}</span>
                <span className="font-semibold text-emerald-300">{entry.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
