'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_STATUS_URL = 'https://worker-production-3838.up.railway.app/status.json';

const num = (v) => (v === null || v === undefined || v === '' || typeof v === 'boolean') ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const usd = (v) => {
  const n = num(v);
  if (n === null) return '—';
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(8)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};
const formatUpdatedAt = (value) => { if (!value) return ''; const n = Number(value); const date = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(); };
const plain = (v) => {
  const n = num(v);
  return n === null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [live, setLive] = useState(false);
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
        setData(next);
        setUpdated(next.updatedAt || next.timestamp || null);
        setLive(true);
      } catch {
        if (mounted && id === requestRef.current) setLive(false);
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [statusUrl]);

  const metrics = useMemo(() => [
    ['Price', usd(data?.price?.usd)],
    ['Liquidity', 'See verified pools below'],
    ['Holders', plain(data?.holders?.count ?? data?.holders)],
    ['24h Volume', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ], [data]);

  const signals = useMemo(() => [
    ['Market Pulse', data?.marketPulse?.mood ?? data?.marketPulse?.activity, data?.marketPulse?.score != null ? `Score ${data.marketPulse.score}/100` : 'No published score'],
    ['Risk Radar', data?.riskRadar?.level, data?.riskRadar?.score != null ? `Risk score ${data.riskRadar.score}` : 'No published score'],
    ['Accumulation', data?.accumulation?.level, data?.accumulation?.confidence != null ? `${data.accumulation.confidence} confidence` : 'No published confidence'],
  ].map(([title, value, detail]) => [title, value ?? 'Unavailable', value == null ? 'Monitor has not published this signal' : detail]), [data]);

  // Only render individual pools when the monitor explicitly supplies them.
  // Never reconstruct DEX liquidity from a token price or screenshot.
  const pools = useMemo(() => {
    const raw = data?.liquidity?.pools;
    if (!Array.isArray(raw)) return [];
    return raw.filter(p => p && typeof p === 'object' && /WOODY/i.test(String(p.pair ?? '')) && num(p.woodyReserve) > 0 && num(p.quoteReserve) > 0)
      .map(p => ({
        venue: String(p.dex ?? 'DEX'),
        pair: String(p.pair),
        woody: num(p.woodyReserve),
        quote: num(p.quoteReserve),
        quoteSymbol: String(p.quoteSymbol ?? ''),
        address: String(p.address ?? ''),
      }));
  }, [data]);

  return (
    <>
      <section className="card glow-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="badge mb-3">WOODY Monitor</p>
            <h1 className="section-title">Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">Live WOODY market data and intelligence from the same monitor that powers Telegram.</p>
          </div>
          <span className={live ? 'status-badge status-active' : 'status-badge status-soon'}>{live ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article key={label} className="live-stat-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
              <p className="mt-2 break-words text-xl font-black text-white md:text-2xl">{value}</p>
            </article>
          ))}
        </div>

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
          <p className="text-xs text-white/40">{live ? 'Auto-refresh every 30 seconds' : 'Live monitor data is temporarily unavailable'}{updated ? ` · Updated ${formatUpdatedAt(updated)}` : ''}</p>
          <div className="flex gap-2">
            <Link href="/buy" className="cta cta-orange text-center">Buy WOODY</Link>
            <Link href="/" className="cta cta-blue text-center">Home</Link>
          </div>
        </div>
      </section>
      <section className="card glow-card p-5 md:p-8" aria-label="Verified pool liquidity">
        <p className="badge mb-3">DEX liquidity</p>
        <h2 className="section-title">Liquidity by pool</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">On-chain reserves reported by WOODY Monitor, separated by pool. These are token balances, not a verified USD TVL.</p>
        {live && pools.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map((p, i) => (
              <article className="live-stat-card" key={`${p.venue}-${p.pair}-${i}`}>
                <p className="text-xs font-semibold text-sky-300">{p.venue}</p>
                <p className="mt-2 text-sm text-white/70">{p.pair}</p>
                <p className="mt-2 text-lg font-black text-white">{plain(p.woody)} WOODY</p><p className="mt-1 text-sm text-white/70">+ {plain(p.quote)} {p.quoteSymbol}</p>
              </article>
            ))}
          </div>
        ) : <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/65">On-chain pool reserves are currently unavailable from the monitor. No unverified USD value will be displayed.</p>}
        <p className="mt-4 text-xs text-white/40">Source: WOODY Monitor · Refresh every 30 seconds when connected.</p>
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
