'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const STATUS_URL = process.env.NEXT_PUBLIC_WOODY_MONITOR_STATUS_URL || 'https://worker-production-3838.up.railway.app/status.json';

const usd = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(8)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};
const number = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '—';

export default function Home() {
  const [data, setData] = useState(null);
  const [live, setLive] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const id = ++requestRef.current;
      try {
        const response = await fetch(STATUS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error();
        const next = await response.json();
        if (!mounted || id !== requestRef.current) return;
        setData(next);
        setLive(true);
      } catch {
        if (mounted && id === requestRef.current) setLive(false);
      }
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const stats = [
    ['Price', usd(data?.price?.usd)],
    ['Liquidity', usd(data?.liquidity?.totalUsd)],
    ['Holders', number(data?.holders?.count ?? data?.holders)],
    ['24h Volume', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-5 md:p-10">
        <div className="relative z-10 grid items-center gap-4 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
          <div className="order-2 md:order-1">
            <span className={live ? 'live-ecosystem-badge' : 'status-badge status-soon'}>
              {live ? <span className="live-pulse-dot" /> : null}{live ? ' WOODY Monitor LIVE' : 'Monitor connecting'}
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">MultiversX · WOODY-5f9d9c</p>
            <h1 className="mt-2 text-5xl font-black leading-none text-white md:text-7xl">WOODY</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">Live WOODY market intelligence, wallet access and trading links in one place.</p>
            <div className="mt-6 grid gap-3 sm:flex">
              <Link href="/app" className="cta cta-orange text-center">Open Command Center</Link>
              <Link href="/buy" className="cta cta-blue text-center">Buy WOODY</Link>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-[260px] md:order-2 md:max-w-md">
            <Image src="/woody-hero.png" alt="WOODY" width={900} height={900} priority className="h-auto w-full drop-shadow-[0_0_45px_rgba(249,115,22,0.18)]" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="live-stat-card">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
            <p className="mt-2 break-words text-xl font-black text-white md:text-2xl">{value}</p>
          </article>
        ))}
      </section>

      <section className="card glow-card p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">One WOODY system</p>
            <h2 className="mt-2 text-2xl font-black text-white">Telegram Monitor + Website Command Center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">The website reads the same WOODY Monitor feed used by the bot, so market status and intelligence stay connected across both interfaces.</p>
          </div>
          <Link href="/app" className="cta cta-blue text-center">View Live Signals</Link>
        </div>
      </section>
    </main>
  );
}
