'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_STATUS_URL = 'https://worker-production-3838.up.railway.app/status.json';
const isFresh = (status) => {
  const updated = Number(status?.updatedAt);
  return status?.freshness?.stale !== true && Number.isFinite(updated) && updated > 0 && Date.now() / 1000 - updated < 120;
};

const num = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
const usd = (v) => {
  const n = num(v);
  if (n === null) return '—';
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(8)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};
const formatUpdatedAt = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const millis = n < 1e12 ? n * 1000 : n;
  return new Date(millis).toLocaleString();
};
const plain = (v, digits = 2) => {
  const n = num(v);
  return n === null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: digits });
};

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [live, setLive] = useState(false);
  const [stale, setStale] = useState(false);
  const [updated, setUpdated] = useState(null);
  const requestRef = useRef(0);
  const statusUrl = process.env.NEXT_PUBLIC_WOODY_MONITOR_STATUS_URL || DEFAULT_STATUS_URL;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const id = ++requestRef.current;
      try {
        const response = await fetch(statusUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Monitor unavailable');
        const next = await response.json();
        if (!mounted || id !== requestRef.current) return;
        const fresh = isFresh(next);
        setData(next);
        setUpdated(next.updatedAt || null);
        setLive(fresh);
        setStale(!fresh);
      } catch {
        if (mounted && id === requestRef.current) { setLive(false); setStale(false); }
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [statusUrl]);

  const metrics = useMemo(() => [
    ['Price', usd(live ? data?.price?.usd : null)],
    ['Market liquidity', usd(live ? data?.liquidity?.totalUsd : null)],
    ['Holders', plain(live ? (data?.holders?.count ?? data?.holders) : null)],
    ['24h Volume', usd(live ? (data?.volume24hUsd ?? data?.volume?.usd) : null)],
  ], [data, live]);

  const signals = useMemo(() => [
    ['Market Pulse', (live && (data?.marketPulse?.mood || data?.marketPulse?.activity)) || 'Unavailable', live && data?.marketPulse?.score != null ? `Score ${data.marketPulse.score}/100` : 'Market activity'],
    ['Risk Radar', (live && data?.riskRadar?.level) || 'Unavailable', live && data?.riskRadar?.score != null ? `Risk score ${data.riskRadar.score}` : 'Risk monitoring'],
    ['Accumulation', (live && data?.accumulation?.level) || 'Unavailable', live && data?.accumulation?.confidence ? `${data.accumulation.confidence} confidence` : 'Accumulation detection'],
    ['Fake Pump', (live && data?.fakePump?.status) || 'Unavailable', live && data?.fakePump?.confidence ? `${data.fakePump.confidence} confidence` : 'Pump detection'],
  ], [data, live]);

  const pools = live && Array.isArray(data?.liquidity?.pools) ? data.liquidity.pools : [];

  return (
    <>
      <section className="card glow-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="badge mb-3">WOODY Monitor</p>
            <h1 className="section-title">Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">Live WOODY market data and intelligence from the same monitor that powers Telegram.</p>
          </div>
          <span className={live ? 'status-badge status-active' : 'status-badge status-soon'}>{live ? 'LIVE' : stale ? 'STALE' : 'OFFLINE'}</span>
        </div>

        <p className="mt-3 text-xs text-white/45">Market liquidity: {live ? (data?.liquidity?.source || 'market feed') : 'unavailable'} estimate. Pool reserves below are observed separately and are not a USD total.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article key={label} className="live-stat-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
              <p className="mt-2 break-words text-xl font-black text-white md:text-2xl">{value}</p>
            </article>
          ))}
        </div>

        {pools.length > 0 && <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer text-sm font-bold text-white">View observed pool reserves ({pools.length})</summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {pools.map((pool) => <div key={`${pool.dex}-${pool.pair}-${pool.address}`} className="rounded-xl border border-white/10 p-3 text-sm">
              <p className="font-semibold text-white">{pool.dex} · {pool.pair}</p>
              {pool.status === 'unavailable' ? <p className="mt-1 text-amber-200">Unavailable: {pool.reason || 'pool data could not be verified'}</p> : <p className="mt-1 text-white/65">{plain(pool.woodyReserve)} WOODY · {plain(pool.quoteReserve, 6)} {pool.quoteSymbol}</p>}
            </div>)}
          </div>
        </details>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {signals.map(([title, value, detail]) => (
            <article key={title} className="ai-module-card">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300/80">{title}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-white/50">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">{live ? 'Auto-refresh every 30 seconds' : stale ? 'Monitor data is stale' : 'Live monitor data is temporarily unavailable'}{updated ? ` · Updated ${formatUpdatedAt(updated)}` : ''}</p>
          <div className="flex gap-2">
            <Link href="/buy" className="cta cta-orange text-center">Buy WOODY</Link>
            <Link href="/" className="cta cta-blue text-center">Home</Link>
          </div>
        </div>
      </section>
      <section aria-labelledby="woody-arcade-title" className="card relative overflow-hidden border border-emerald-400/30 bg-gradient-to-br from-emerald-950/70 via-slate-950 to-orange-950/30 p-5 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">WOODY Arcade · Season 1</p>
            <h2 id="woody-arcade-title" className="mt-2 text-2xl font-black text-white md:text-3xl">WOODY Forest Adventure</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">Three levels. Collect coins, dodge traps and face Shadow WOODY King. Your personal records and unlocked levels stay on this device.</p>
            <p className="mt-2 text-xs text-amber-200/80">Free browser game · No wallet connection required · In-game points have no token value</p>
          </div>
          <Link href="/forest-adventure" className="cta cta-orange shrink-0 text-center" aria-label="Play WOODY Forest Adventure">▶ PLAY WOODY</Link>
        </div>
      </section>
    </>
  );
}
