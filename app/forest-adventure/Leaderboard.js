'use client';

import { useEffect, useState } from 'react';

const periods = [
  { id: 'weekly', label: 'This week' },
  { id: 'all', label: 'All time' },
];
const medals = ['♛', 'Ⅱ', 'Ⅲ'];

export default function Leaderboard() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setRefreshing(true);
    fetch('/api/forest/leaderboard?period=' + period, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok && !result.status) throw new Error('leaderboard_unavailable');
        return result;
      })
      .then(setData)
      .catch(error => {
        if (error.name !== 'AbortError') setData({ status: 'unavailable', rows: [], season: null });
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false);
      });
    return () => controller.abort();
  }, [period, refreshKey]);

  const rows = data?.rows || [];
  const podium = rows.slice(0, 3);
  const remaining = rows.slice(3);

  return (
    <section id="leaderboard" className="relative mt-7 overflow-hidden rounded-[28px] border border-emerald-300/20 bg-[#08151b] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:mt-10 sm:p-7 md:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-2xl text-amber-200 shadow-[0_0_32px_rgba(251,191,36,.08)] sm:h-14 sm:w-14 sm:text-3xl" aria-hidden="true">♛</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.28em] text-emerald-300">WOODY ARCADE · RANKINGS</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">Forest leaderboard</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">A place for verified Forest Adventure runs. No entry fees, ads, or automatic prizes.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-slate-950/70 p-1" aria-label="Leaderboard period">
              {periods.map(item => (
                <button key={item.id} type="button" onClick={() => setPeriod(item.id)} aria-pressed={period === item.id}
                  className={'rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ' + (period === item.id ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setRefreshKey(value => value + 1)} disabled={refreshing} aria-label="Refresh leaderboard"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-lg text-slate-200 transition hover:border-emerald-300/40 hover:text-emerald-200 disabled:opacity-50">
              <span className={refreshing ? 'animate-spin' : ''} aria-hidden="true">↻</span>
            </button>
          </div>
        </header>

        {data?.season && period === 'weekly' && (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[.06] px-4 py-3 text-xs text-emerald-100/80">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
            <span className="font-bold uppercase tracking-wider text-emerald-200">Season {data.season.status}</span>
            <span className="text-white/25">/</span>
            <span>{new Date(data.season.starts_at).toLocaleDateString()} – {new Date(data.season.ends_at).toLocaleDateString()}</span>
          </div>
        )}

        {!data && (
          <div role="status" className="mt-6 grid min-h-44 place-items-center rounded-2xl border border-white/10 bg-slate-950/40 text-sm text-slate-300">
            <span className="animate-pulse">Loading verified rankings…</span>
          </div>
        )}
        {data?.status === 'setup' && (
          <div role="status" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-950/25 p-5 text-sm text-amber-100">
            The leaderboard service is being configured. Ranked scores will appear here once verification is active.
          </div>
        )}
        {data?.status === 'no-season' && period === 'weekly' && (
          <div role="status" className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-950/20 p-5 text-sm text-sky-100">
            There is no open weekly season right now. Check the all-time board for verified runs.
          </div>
        )}
        {data?.status === 'unavailable' && (
          <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-950/25 p-5 text-sm text-amber-100">
            <span>The leaderboard could not be reached. Your game and local records are unaffected.</span>
            <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="rounded-lg border border-amber-100/20 px-3 py-2 font-bold hover:bg-amber-100/10">Try again</button>
          </div>
        )}
        {data?.status === 'ok' && !rows.length && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-emerald-300/25 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,.10),transparent_65%),rgba(2,6,23,.42)] px-5 py-10 text-center sm:px-8 sm:py-14">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-3xl text-amber-200" aria-hidden="true">🏆</span>
            <h3 className="mt-5 text-lg font-black text-white sm:text-xl">The forest is waiting for its first verified score</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Your personal best is saved on this device. Global ranked scores will appear here when secure score submission and verification are enabled.</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Ranked score submissions are not active
            </div>
          </div>
        )}
        {podium.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {podium.map((row, index) => (
              <article key={row.username} className={'relative overflow-hidden rounded-2xl border p-4 sm:p-5 ' + (index === 0 ? 'border-amber-200/25 bg-gradient-to-br from-amber-300/10 to-slate-950/70 lg:-translate-y-1' : 'border-white/10 bg-slate-950/55')}>
                <div className="flex items-center justify-between gap-3">
                  <span className={'grid h-10 w-10 place-items-center rounded-xl text-lg font-black ' + (index === 0 ? 'bg-amber-300/15 text-amber-200' : index === 1 ? 'bg-slate-300/10 text-slate-200' : 'bg-orange-300/10 text-orange-200')}>{medals[index]}</span>
                  <span className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">{index === 0 ? 'Forest champion' : 'Rank ' + (index + 1)}</span>
                </div>
                <h3 className="mt-4 truncate text-lg font-black text-white">{row.username}</h3>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <span className="text-xs text-slate-400">{Number(row.games).toLocaleString()} verified runs</span>
                  <span className="text-xl font-black tabular-nums text-emerald-300">{Number(row.points).toLocaleString()}<small className="ml-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/60">pts</small></span>
                </div>
              </article>
            ))}
          </div>
        )}
        {remaining.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_76px_90px] gap-2 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-400 sm:grid-cols-[56px_minmax(0,1fr)_120px_140px] sm:px-5">
              <span>Rank</span><span>Player</span><span className="text-right">Runs</span><span className="text-right">Points</span>
            </div>
            {remaining.map((row, index) => (
              <div key={row.username} className="grid grid-cols-[44px_minmax(0,1fr)_76px_90px] items-center gap-2 border-b border-white/[.06] px-4 py-3 text-sm last:border-0 sm:grid-cols-[56px_minmax(0,1fr)_120px_140px] sm:px-5">
                <span className="font-bold tabular-nums text-slate-400">{index + 4}</span>
                <span className="truncate font-bold text-white">{row.username}</span>
                <span className="text-right tabular-nums text-slate-300">{Number(row.games).toLocaleString()}</span>
                <span className="text-right font-black tabular-nums text-emerald-300">{Number(row.points).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        <footer className="mt-5 flex flex-col gap-2 border-t border-white/[.08] pt-4 text-xs leading-relaxed text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Only server-verified scores are ranked. No paid entry or automatic prizes.</span>
          <span>Wallet connection does not sign a message or send a transaction.</span>
        </footer>
      </div>
    </section>
  );
}
