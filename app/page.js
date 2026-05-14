'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_WOODY_MONITOR_STATUS_URL = 'https://worker-production-3838.up.railway.app/status.json';

const monitorItems = [
  { title: 'Monitoring', value: '24/7', note: 'Wallet flow and momentum tracking' },
  { title: 'Liquidity', value: 'Multi-pool', note: 'Depth watch across WOODY pairs' },
  { title: 'Swaps', value: 'Live-ready', note: 'Fast routing through ecosystem venues' },
  { title: 'Holders', value: 'Growing', note: 'Community wallet base expanding' },
];

const demoAiDashboardModules = [
  {
    title: 'Market Pulse',
    value: '42/100',
    status: 'Steady signal',
    description: 'AI module that scores current meme-market strength and directional conviction.',
  },
  {
    title: 'Risk Radar',
    value: 'LOW',
    status: 'Risk Level',
    description: 'AI module that evaluates volatility clusters, whale shifts, and sudden downside pressure.',
  },
  {
    title: 'Wallet Intelligence',
    value: 'Active',
    status: 'Smart watch',
    description: 'AI module tracking notable wallet behavior, rotation patterns, and potential intent.',
  },
  {
    title: 'Accumulation Detection',
    value: 'MODERATE',
    status: 'Build phase',
    description: 'AI module scanning for sustained buy-side buildup across tracked WOODY ecosystem pools.',
  },
  {
    title: 'Fake Pump Detection',
    value: 'HEALTHY MOMENTUM',
    status: 'No spoof pattern',
    description: 'AI module differentiating organic continuation from short-lived liquidity traps.',
  },
  {
    title: 'Live Buy/Sell Alerts',
    value: 'Demo stream',
    status: 'Static preview',
    description: 'AI module previewing event-style buy/sell notifications for community market awareness.',
  },
  {
    title: 'Multi-Pool Liquidity Watch',
    value: '7 pools',
    status: 'Coverage map',
    description: 'AI module surveying depth, slippage pressure, and routing health across liquidity venues.',
  },
];

const buildLiveDashboardModules = (statusData) => {
  const { marketPulse, riskRadar, walletIntelligence, accumulation, fakePump, price, liquidity } = statusData;

  return [
    {
      title: 'Market Pulse',
      value: `${marketPulse.score}/100`,
      status: `${marketPulse.mood} • ${marketPulse.activity}`,
      description: 'AI module that scores current meme-market strength and directional conviction.',
    },
    {
      title: 'Risk Radar',
      value: riskRadar.level,
      status: `Risk Score ${riskRadar.score}`,
      description: 'AI module that evaluates volatility clusters, whale shifts, and sudden downside pressure.',
    },
    {
      title: 'Wallet Intelligence',
      value: walletIntelligence.signal,
      status: `${walletIntelligence.confidence} confidence • ${walletIntelligence.risk} risk`,
      description: 'AI module tracking notable wallet behavior, rotation patterns, and potential intent.',
    },
    {
      title: 'Accumulation Detection',
      value: accumulation.level,
      status: `${accumulation.confidence} confidence`,
      description: 'AI module scanning for sustained buy-side buildup across tracked WOODY ecosystem pools.',
    },
    {
      title: 'Fake Pump Detection',
      value: fakePump.status,
      status: `${fakePump.confidence} confidence`,
      description: 'AI module differentiating organic continuation from short-lived liquidity traps.',
    },
    {
      title: 'Live Buy/Sell Alerts',
      value: `$${Number(price.usd).toLocaleString()}`,
      status: 'Live price stream',
      description: 'AI module previewing event-style buy/sell notifications for community market awareness.',
    },
    {
      title: 'Multi-Pool Liquidity Watch',
      value: `$${Number(liquidity.totalUsd).toLocaleString()}`,
      status: 'Live liquidity depth',
      description: 'AI module surveying depth, slippage pressure, and routing health across liquidity venues.',
    },
  ];
};

const gameItems = [
  { title: 'Collectible Cards', text: 'WOODY card drops with rarity tiers and utility hooks.' },
  { title: 'Poker Energy', text: 'Cinematic poker-style aesthetics for social game modes.' },
  { title: 'Arcade Teasers', text: 'Fast mini-game concepts connected to community seasons.' },
];

export default function Home() {
  const [aiDashboardModules, setAiDashboardModules] = useState(demoAiDashboardModules);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const statusUrl = process.env.NEXT_PUBLIC_WOODY_MONITOR_STATUS_URL || DEFAULT_WOODY_MONITOR_STATUS_URL;

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch(statusUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Status endpoint unavailable');

        const statusData = await response.json();
        const liveModules = buildLiveDashboardModules(statusData);

        if (!isMounted) return;
        setAiDashboardModules(liveModules);
        setLastUpdated(statusData.updatedAt ?? null);
        setIsLiveData(true);
      } catch (error) {
        if (!isMounted) return;
        setAiDashboardModules(demoAiDashboardModules);
        setIsLiveData(false);
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [statusUrl]);

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return 'Last updated: Demo snapshot';
    const parsedDate = new Date(lastUpdated);
    if (Number.isNaN(parsedDate.getTime())) return 'Last updated: Demo snapshot';
    return `Last updated: ${parsedDate.toLocaleString()}`;
  }, [lastUpdated]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:gap-12 md:px-8 md:py-12">
      <section className="card cyber-grid relative overflow-hidden p-6 md:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="badge mb-4">WOODY Ecosystem</p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">WOODY</h1>
            <p className="mt-4 max-w-xl text-white/75 md:text-lg">A cinematic crypto brand focused on signals, games, and community momentum.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="cta cta-orange">Buy WOODY</a>
              <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="cta cta-blue">Telegram</a>
              <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="cta cta-green">Twitter / X</a>
            </div>
          </div>
          <div className="glow-card rounded-2xl p-5">
            <Image src="/woody-hero.png" alt="WOODY mascot full body" width={640} height={820} priority className="mx-auto h-auto w-full max-w-sm object-contain" />
          </div>
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">WOODY Monitor</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {monitorItems.map((item) => (
            <article key={item.title} className="holo-panel rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">{item.title}</p>
              <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
              <p className="mt-1 text-xs text-white/65">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">WOODY Monitor AI Dashboard</h2>
            <p className="mt-2 text-sm text-white/70">WOODY Monitor AI modules now sync with live bot telemetry when available, with demo fallback safety.</p>
            <p className="mt-1 text-xs text-white/55">{updatedLabel}</p>
          </div>
          <span className="module-pill">{isLiveData ? 'LIVE DATA' : 'DEMO MODE'}</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {aiDashboardModules.map((item) => (
            <article key={item.title} className="ai-module-card">
              <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300/90">WOODY Monitor AI Module</p>
              <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xl font-black text-orange-300">{item.value}</p>
                <span className="signal-chip">{item.status}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">Games & Cards</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {gameItems.map((item) => (
            <article key={item.title} className="playing-card">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Future</p>
              <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">Community</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="cta cta-blue">Telegram</a>
          <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="cta cta-green">Twitter / X</a>
          <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="cta cta-orange">Buy</a>
        </div>
      </section>
    </main>
  );
}
