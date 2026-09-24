'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_STATUS_URL = 'https://worker-production-3838.up.railway.app/status.json';

const num = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
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
        setUpdated(next.updatedAt || new Date().toISOString());
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
    ['Liquidity', usd(data?.liquidity?.totalUsd)],
    ['Holders', plain(data?.holders?.count ?? data?.holders)],
    ['24h Volume', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ], [data]);

  const signals = useMemo(() => [
    ['Market Pulse', data?.marketPulse?.mood || data?.marketPulse?.activity || (live ? 'Live' : 'Unavailable'), data?.marketPulse?.score != null ? `Score ${data.marketPulse.score}/100` : 'Market activity'],
    ['Risk Radar', data?.riskRadar?.level || (live ? 'Live' : 'Unavailable'), data?.riskRadar?.score != null ? `Risk score ${data.riskRadar.score}` : 'Risk monitoring'],
    ['Accumulation', data?.accumulation?.level || (live ? 'Live' : 'Unavailable'), data?.accumulation?.confidence ? `${data.accumulation.confidence} confidence` : 'Accumulation detection'],
    ['Fake Pump', data?.fakePump?.status || (live ? 'Live' : 'Unavailable'), data?.fakePump?.confidence ? `${data.fakePump.confidence} confidence` : 'Pump detection'],
  ], [data, live]);

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
    </>
  );
}
