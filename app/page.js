'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const DEFAULT_WOODY_MONITOR_STATUS_URL = 'https://worker-production-3838.up.railway.app/status.json';

const formatUsd = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  if (number === 0) return '$0';
  if (number < 0.01) return `$${number.toFixed(8)}`;
  if (number < 1) return `$${number.toFixed(4)}`;
  return `$${number.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};

const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const buildLiveDashboardModules = (statusData) => {
  const marketPulse = statusData.marketPulse || {};
  const riskRadar = statusData.riskRadar || {};
  const walletIntelligence = statusData.walletIntelligence || {};
  const accumulation = statusData.accumulation || {};
  const fakePump = statusData.fakePump || {};
  const price = statusData.price || {};
  const liquidity = statusData.liquidity || {};

  return [
    { title: 'Market Pulse', value: Number.isFinite(Number(marketPulse.score)) ? `${marketPulse.score}/100` : 'Live', status: [marketPulse.mood, marketPulse.activity].filter(Boolean).join(' • ') || 'Monitor connected' },
    { title: 'Risk Radar', value: riskRadar.level || 'Live', status: riskRadar.score != null ? `Risk Score ${riskRadar.score}` : 'Monitor connected' },
    { title: 'Wallet Intelligence', value: walletIntelligence.signal || 'Live', status: [walletIntelligence.confidence, walletIntelligence.risk].filter(Boolean).join(' confidence • ') || 'Monitor connected' },
    { title: 'Accumulation Detection', value: accumulation.level || 'Live', status: accumulation.confidence ? `${accumulation.confidence} confidence` : 'Monitor connected' },
    { title: 'Fake Pump Detection', value: fakePump.status || 'Live', status: fakePump.confidence ? `${fakePump.confidence} confidence` : 'Monitor connected' },
    { title: 'Live Price', value: formatUsd(price.usd), status: 'Monitor feed' },
    { title: 'Total Liquidity', value: formatUsd(liquidity.totalUsd), status: 'Multi-pool monitor' },
  ];
};

export default function Home() {
  const [statusData, setStatusData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState('');

  const statusUrl = process.env.NEXT_PUBLIC_WOODY_MONITOR_STATUS_URL || DEFAULT_WOODY_MONITOR_STATUS_URL;

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch(statusUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Status endpoint unavailable');
        const data = await response.json();
        if (!isMounted) return;
        setStatusData(data);
        setLastUpdated(data.updatedAt || new Date().toISOString());
        setIsLiveData(true);
        setError('');
      } catch (fetchError) {
        console.error('WOODY monitor status fetch failed', fetchError);
        if (isMounted) setError('Live monitor unavailable');
      }
    };

    fetchStatus();
    const timer = window.setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [statusUrl]);

  const stats = useMemo(() => {
    const price = statusData?.price || {};
    const liquidity = statusData?.liquidity || {};
    return [
      { label: 'Price', value: formatUsd(price.usd), note: isLiveData ? 'Live monitor feed' : 'Waiting for live feed' },
      { label: 'Holders', value: formatNumber(statusData?.holders?.count ?? statusData?.holders), note: isLiveData ? 'Tracked on monitor' : 'Waiting for live feed' },
      { label: 'Liquidity', value: formatUsd(liquidity.totalUsd), note: isLiveData ? 'Multi-pool monitor' : 'Waiting for live feed' },
      { label: '24h Volume', value: formatUsd(statusData?.volume24hUsd ?? statusData?.volume?.usd), note: isLiveData ? 'Monitor feed' : 'Waiting for live feed' },
    ];
  }, [statusData, isLiveData]);

  const modules = useMemo(() => statusData ? buildLiveDashboardModules(statusData) : [], [statusData]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-6 md:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="live-ecosystem-badge"><span className="live-pulse-dot" /> Live dApp</span>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">MultiversX utility hub</p>
            <h1 className="mt-3 text-5xl font-black leading-none text-white md:text-7xl">WOODY</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">A real wallet-connected WOODY dApp with live on-chain balances and a live market monitor. Connect your wallet and use the dashboard as the control center.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/app" className="cta cta-orange">Launch dApp</Link>
              <Link href="/buy" className="cta cta-blue">Buy WOODY</Link>
              <a href="https://xexchange.com" target="_blank" rel="noopener noreferrer" className="cta cta-buy">Open xExchange</a>
            </div>
            {error ? <p className="mt-4 text-xs text-orange-200">{error} — wallet features remain available.</p> : null}
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <Image src="/woody-hero.png" alt="WOODY" width={900} height={900} priority className="h-auto w-full drop-shadow-[0_0_50px_rgba(249,115,22,0.18)]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="live-stat-card">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-white/50">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="card glow-card p-5 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="badge mb-3">WOODY Monitor</p>
            <h2 className="section-title">Live market command center</h2>
          </div>
          <span className={isLiveData ? 'status-badge status-active' : 'status-badge status-soon'}>{isLiveData ? 'LIVE' : 'CONNECTING'}</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(isLiveData ? modules : [
            { title: 'Market Pulse', value: '—', status: 'Waiting' },
            { title: 'Risk Radar', value: '—', status: 'Waiting' },
            { title: 'Wallet Intelligence', value: '—', status: 'Waiting' },
            { title: 'Accumulation', value: '—', status: 'Waiting' },
            { title: 'Fake Pump Detection', value: '—', status: 'Waiting' },
            { title: 'Live Price', value: '—', status: 'Waiting' },
            { title: 'Total Liquidity', value: '—', status: 'Waiting' },
          ]).map((module) => (
            <article key={module.title} className="ai-module-card">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-300/80">{module.title}</p>
              <p className="mt-3 text-2xl font-black text-white">{module.value}</p>
              <p className="mt-2 text-xs text-orange-200/80">{module.status}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
          <span>{isLiveData ? 'Monitor endpoint connected. Auto-refresh: 30s.' : 'Connecting to monitor endpoint…'}</span>
          {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleString()}</span> : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="app-dashboard-card">
          <span className="app-card-icon">👛</span>
          <h3 className="mt-5 text-lg font-bold text-white">Wallet Dashboard</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Connect xPortal, MultiversX DeFi Wallet, or Web Wallet and read your EGLD + WOODY balances.</p>
          <Link href="/app" className="mt-5 inline-flex w-full justify-center rounded-xl border border-sky-400/50 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 hover:bg-sky-400/20">Open Wallet</Link>
        </article>
        <article className="app-dashboard-card">
          <span className="app-card-icon">💱</span>
          <h3 className="mt-5 text-lg font-bold text-white">Buy WOODY</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Verify the official token ID and continue to the MultiversX trading venue.</p>
          <Link href="/buy" className="mt-5 inline-flex w-full justify-center rounded-xl border border-orange-400/50 bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100 hover:bg-orange-400/20">Open Buy Hub</Link>
        </article>
        <article className="app-dashboard-card">
          <span className="app-card-icon">🎡</span>
          <h3 className="mt-5 text-lg font-bold text-white">WOODY Spin</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">Community game area, currently separated from wallet transactions and real rewards.</p>
          <Link href="/spin" className="mt-5 inline-flex w-full justify-center rounded-xl border border-orange-400/50 bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100 hover:bg-orange-400/20">Open Spin</Link>
        </article>
      </section>
    </main>
  );
}
