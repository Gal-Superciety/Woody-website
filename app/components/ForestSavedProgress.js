'use client';

import { useEffect, useState } from 'react';

export default function ForestSavedProgress({ wallet }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    const controller = new AbortController();
    setProgress(null);
    setError(false);
    fetch('/api/forest/progress?wallet=' + encodeURIComponent(wallet), {
      signal: controller.signal,
      cache: 'no-store',
    }).then(async response => {
      if (!response.ok) throw new Error('progress_unavailable');
      return response.json();
    }).then(data => { if (!controller.signal.aborted) setProgress(data.progress); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [wallet]);

  return (
    <section className="mt-5 rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-white" aria-label="Saved Forest Adventure progress">
      <h2 className="text-lg font-black text-emerald-200">Your saved Forest Adventure progress</h2>
      {progress ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['Best score', progress.best_score],
            ['Unlocked level', (Number(progress.unlocked_level) || 1) + ' / 3'],
            ['Boss victories', progress.boss_wins],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-950/80 p-3 text-center">
              <strong className="block text-xl font-black text-amber-200">{value}</strong>
              <span className="mt-1 block text-[11px] text-white/65">{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/65">{error ? 'Could not load your saved progress.' : 'Loading your saved game progress…'}</p>
      )}
      <p className="mt-3 text-xs text-white/50">Cloud progression updates after a finished game. Local records remain available for offline recovery.</p>
    </section>
  );
}
