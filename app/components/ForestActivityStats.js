'use client';

import { useEffect, useState } from 'react';

export default function ForestActivityStats() {
  const [stats, setStats] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/forest/leaderboard?period=all', { cache: 'no-store' });
        if (!response.ok) throw new Error('stats_unavailable');
        const data = await response.json();
        if (active) { setStats(data.stats || null); setUnavailable(false); }
      } catch {
        if (active) setUnavailable(true);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return (
    <section className="my-7 rounded-2xl border border-emerald-400/20 bg-slate-900/50 p-5 sm:p-6" aria-label="Live WOODY Gaming statistics">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-black text-white">WOODY Gaming · Live activity</h2>
        <span className="text-xs text-white/50">Based on recorded database activity · refreshes every minute</span>
      </div>
      {stats ? (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ['Created profiles', stats.profiles],
            ['Active · 3 min', stats.active_now],
            ['Playing · 3 min', stats.playing_now],
            ['Players with games', stats.players_with_runs],
            ['Saved games', stats.saved_runs],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <strong className="block text-2xl font-black tabular-nums text-emerald-200">{Number(value || 0).toLocaleString()}</strong>
              <span className="mt-1 block text-xs text-white/65">{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p role="status" className="mt-4 text-sm text-white/65">{unavailable ? 'Live statistics are temporarily unavailable.' : 'Loading live statistics…'}</p>
      )}
      <p className="mt-3 text-xs text-white/45">Active and playing counts reflect players with recent Forest Adventure heartbeats, not all WOODY site visitors.</p>
    </section>
  );
}
