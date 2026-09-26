'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const num = (v) => (v === null || v === undefined || v === '' || typeof v === 'boolean') ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const usd = (v) => {
  const n = num(v);
  if (n === null) return '—';
  if (n === 0) return '$0';
  if (n > 0 && n < 0.00000001) return '$' + n.toExponential(2);
  if (n > 0 && n < 0.01) return '$' + n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  return '
};
const formatUpdatedAt = (value) => { if (!value) return ''; const n = Number(value); const date = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(); };
const plain = (v) => {
  const n = num(v);
  return n === null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState(null);
  const requestRef = useRef(0);
  const statusUrl = '/api/woody-status';

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
        if (mounted && id === requestRef.current) { setLive(false); setData(null); setUpdated(null); }
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [statusUrl]);

  const metrics = useMemo(() => [
    ['Price', usd(data?.price?.usd)],
    ['Reported liquidity', usd(data?.liquidity?.totalUsd)],
    ['Holders', plain(data?.holders?.count ?? data?.holders)],
    ['24h Volume', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ], [data]);

  const signals = useMemo(() => [
    ['Market Pulse', data?.marketPulse?.mood ?? data?.marketPulse?.activity, data?.marketPulse?.score != null ? `Score ${data.marketPulse.score}/100` : 'No published score'],
    ['Risk Radar', data?.riskRadar?.level, data?.riskRadar?.score != null ? `Risk score ${data.riskRadar.score}` : 'No published score'],
    ['Accumulation', data?.accumulation?.level, data?.accumulation?.confidence != null ? `Confidence ${data.accumulation.confidence}` : 'No published confidence'],
    ['Wallet Intelligence', data?.walletIntelligence?.signal, data?.walletIntelligence?.reason || 'No published signal'],
    ['Fake Pump Check', data?.fakePump?.status, data?.fakePump?.confidence != null ? `Confidence ${data.fakePump.confidence}` : 'No published confidence'],
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

  const unavailablePools = useMemo(() => Array.isArray(data?.liquidity?.pools) ? data.liquidity.pools.filter(p => p?.status === 'unavailable') : [], [data]);

  return (
    <>
      <section className="card glow-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="badge mb-3">WOODY Monitor</p>
            <h1 className="section-title">Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">WOODY market data and monitor signals. Reported liquidity is a source estimate, not independently verified pool TVL.</p>
          </div>
          <span className={live ? 'status-badge status-active' : 'status-badge status-soon'}>{live ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article key={label} className="live-stat-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
              <p className="mt-2 whitespace-nowrap text-[clamp(0.85rem,3.6vw,1.5rem)] font-black tracking-tight text-white tabular-nums">{value}</p>
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
      <section className="card glow-card p-5 md:p-8" aria-label="Observed pool reserves">
        <p className="badge mb-3">DEX reserves</p>
        <h2 className="section-title">Liquidity and reserves by pool</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">On-chain reserves reported by WOODY Monitor, separated by pool. These are token balances, not a verified USD TVL.</p>
        {live && data?.liquidity?.totalUsd != null && <p className="mt-4 text-sm text-white/70">Reported USD liquidity: <strong className="text-white">{usd(data.liquidity.totalUsd)}</strong> · Source: {data.liquidity.source || 'WOODY Monitor'} · This aggregate is not the sum of the pool balances shown below.</p>}
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
        {live && unavailablePools.length > 0 && <div className="mt-4 rounded-xl border border-amber-400/20 p-4"><p className="text-sm font-bold text-amber-200">Pools awaiting verified data</p>{unavailablePools.map((p,i) => <p className="mt-2 text-xs text-white/60" key={p.address || i}>{p.dex} · {p.pair}: {p.reason || 'Unavailable'}</p>)}</div>}
        <p className="mt-4 text-xs text-white/40">Source: WOODY Monitor · Pools with readable on-chain reserves only. OneDex appears when its pool data is available. Refresh every 30 seconds.</p>
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
 + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
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
  const statusUrl = '/api/woody-status';

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
        if (mounted && id === requestRef.current) { setLive(false); setData(null); setUpdated(null); }
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [statusUrl]);

  const metrics = useMemo(() => [
    ['Price', usd(data?.price?.usd)],
    ['Reported liquidity', usd(data?.liquidity?.totalUsd)],
    ['Holders', plain(data?.holders?.count ?? data?.holders)],
    ['24h Volume', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ], [data]);

  const signals = useMemo(() => [
    ['Market Pulse', data?.marketPulse?.mood ?? data?.marketPulse?.activity, data?.marketPulse?.score != null ? `Score ${data.marketPulse.score}/100` : 'No published score'],
    ['Risk Radar', data?.riskRadar?.level, data?.riskRadar?.score != null ? `Risk score ${data.riskRadar.score}` : 'No published score'],
    ['Accumulation', data?.accumulation?.level, data?.accumulation?.confidence != null ? `Confidence ${data.accumulation.confidence}` : 'No published confidence'],
    ['Wallet Intelligence', data?.walletIntelligence?.signal, data?.walletIntelligence?.reason || 'No published signal'],
    ['Fake Pump Check', data?.fakePump?.status, data?.fakePump?.confidence != null ? `Confidence ${data.fakePump.confidence}` : 'No published confidence'],
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

  const unavailablePools = useMemo(() => Array.isArray(data?.liquidity?.pools) ? data.liquidity.pools.filter(p => p?.status === 'unavailable') : [], [data]);

  return (
    <>
      <section className="card glow-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="badge mb-3">WOODY Monitor</p>
            <h1 className="section-title">Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">WOODY market data and monitor signals. Reported liquidity is a source estimate, not independently verified pool TVL.</p>
          </div>
          <span className={live ? 'status-badge status-active' : 'status-badge status-soon'}>{live ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <article key={label} className="live-stat-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
              <p className="mt-2 break-all text-lg font-black tracking-tight text-white sm:break-normal sm:text-xl md:text-2xl">{value}</p>
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
      <section className="card glow-card p-5 md:p-8" aria-label="Observed pool reserves">
        <p className="badge mb-3">DEX reserves</p>
        <h2 className="section-title">Liquidity and reserves by pool</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">On-chain reserves reported by WOODY Monitor, separated by pool. These are token balances, not a verified USD TVL.</p>
        {live && data?.liquidity?.totalUsd != null && <p className="mt-4 text-sm text-white/70">Reported USD liquidity: <strong className="text-white">{usd(data.liquidity.totalUsd)}</strong> · Source: {data.liquidity.source || 'WOODY Monitor'} · This aggregate is not the sum of the pool balances shown below.</p>}
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
        {live && unavailablePools.length > 0 && <div className="mt-4 rounded-xl border border-amber-400/20 p-4"><p className="text-sm font-bold text-amber-200">Pools awaiting verified data</p>{unavailablePools.map((p,i) => <p className="mt-2 text-xs text-white/60" key={p.address || i}>{p.dex} · {p.pair}: {p.reason || 'Unavailable'}</p>)}</div>}
        <p className="mt-4 text-xs text-white/40">Source: WOODY Monitor · Pools with readable on-chain reserves only. OneDex appears when its pool data is available. Refresh every 30 seconds.</p>
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
