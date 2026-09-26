'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMonitor } from './lib/useMonitor';
import { usd, plain } from './lib/monitor';
import MonitorStatus from './components/MonitorStatus';

export default function Home() {
  const { data, live, status, refreshing, refresh } = useMonitor();
  const stats = [
    ['Price', usd(data?.price?.usd)],
    ['Pool liquidity · est.', usd(data?.liquidity?.totalUsd)],
    ['Holders', plain(data?.holders?.count ?? data?.holders)],
    ['Tracked volume · 24h', usd(data?.volume24hUsd ?? data?.volume?.usd)],
  ];

  return (
    <main className="v2-home">
      <section className="v2-hero">
        <div className="v2-hero-noise" aria-hidden="true" />
        <div className="v2-container v2-hero-layout">
          <div className="v2-hero-copy">
            <div className="v2-eyebrow"><span className={live ? 'v2-status-dot' : 'v2-status-dot v2-offline'} /> {live ? 'LIVE ECOSYSTEM DATA' : status === 'loading' ? 'CONNECTING TO MONITOR' : 'MONITOR UNAVAILABLE'} <span className="v2-eyebrow-divider" /> MULTIVERSX</div>
            <p className="v2-hero-kicker">THE WOODY UNIVERSE</p>
            <h1>NOT JUST<br /><em>A MEME.</em><br />A MOVEMENT<span className="v2-period">.</span></h1>
            <p className="v2-hero-description">Meet WOODY. One home for market intelligence, the community and a growing world of experiences on MultiversX.</p>
            <div className="v2-actions">
              <Link href="/app" className="v2-primary">OPEN COMMAND CENTER <span aria-hidden="true">↗</span></Link>
              <Link href="/buy" className="v2-secondary">BUY WOODY <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="v2-contract"><span>OFFICIAL TOKEN</span><code>WOODY-5f9d9c</code></div>
          </div>
          <div className="v2-art">
            <div className="v2-orbit v2-orbit-one" /><div className="v2-orbit v2-orbit-two" />
            <span className="v2-art-coordinate v2-coordinate-top">01 / THE WOODY UNIVERSE</span>
            <Image src="/woody-hero.png" alt="WOODY mascot" width={900} height={900} priority className="v2-mascot" />
            <span className="v2-art-coordinate v2-coordinate-bottom">BUILT ON MULTIVERSX ↗</span>
            <span className="v2-art-word" aria-hidden="true">WOODY</span>
          </div>
        </div>
        <div className="v2-hero-bottom v2-container"><span>SCROLL TO EXPLORE ↓</span><span>MARKET INTELLIGENCE / COMMUNITY / ARCADE</span></div>
      </section>

      <section className="v2-market" aria-label="Live market snapshot">
        <div className="v2-container">
          <div className="v2-section-heading"><div><span className="v2-section-index">01 / MARKET PULSE</span><h2>THE NUMBERS<span>.</span></h2></div><span className="v2-market-source"><span className={live ? 'v2-status-dot' : 'v2-status-dot v2-offline'} /> {live ? 'WOODY MONITOR CONNECTED' : 'LIVE FEED UNAVAILABLE'}</span></div>
          <div className="v2-market-grid">{stats.map(([label,value],i)=><div className="v2-metric" key={label}><span className="v2-metric-index">0{i+1}</span><span className="v2-metric-label">{label}</span><strong>{label === 'Pool liquidity · est.' ? <Link href="/app#pools" className="underline decoration-orange-300/50 underline-offset-4 hover:text-orange-300">{value}</Link> : value}</strong><span className="v2-metric-foot">WOODY / MULTIVERSX</span></div>)}</div>
          <MonitorStatus status={status} updatedAt={data?.updatedAt} refreshing={refreshing} refresh={refresh} /><p className="v2-data-note">Source: WOODY Monitor. Liquidity is an estimate across readable pools; volume covers detected trades. Missing data is shown as —.</p>
        </div>
      </section>

      <section className="v2-explore v2-container" aria-label="Explore WOODY">
        <div className="v2-section-heading"><div><span className="v2-section-index">02 / DISCOVER THE ECOSYSTEM</span><h2>YOUR WORLD<span>.</span></h2></div><p>Everything WOODY, without the noise. Choose where you want to go.</p></div>
        <div className="v2-explore-grid">
          <Link href="/app" className="v2-feature v2-feature-main"><span className="v2-feature-top">01 — INTELLIGENCE <span>↗</span></span><div className="v2-feature-graphic" aria-hidden="true"><span className="v2-graphic-ring"/><span className="v2-graphic-core">W</span><span className="v2-graphic-line"/></div><div><span className="v2-feature-tag">THE CONTROL ROOM</span><h3>COMMAND<br/>CENTER</h3><p>Market data, signals and wallet access. Your WOODY dashboard.</p><span className="v2-feature-link">EXPLORE THE DASHBOARD ↗</span></div></Link>
          <div className="v2-feature-stack">
            <Link href="/buy" className="v2-feature v2-feature-buy"><span className="v2-feature-top">02 — TRADING <span>↗</span></span><div><span className="v2-feature-tag">GET STARTED</span><h3>BUY WOODY</h3><p>Explore the available trading routes for the official token.</p><span className="v2-feature-link">FIND TRADING OPTIONS ↗</span></div><span className="v2-feature-symbol" aria-hidden="true">↗</span></Link>
            <Link href="/forest-adventure" className="v2-feature v2-feature-game"><span className="v2-feature-top">03 — THE ARCADE <span>↗</span></span><div><span className="v2-feature-tag">SEASON 01 / PLAY FREE</span><h3>FOREST<br/>ADVENTURE</h3><p>Step into the WOODY universe. Three levels, one final boss.</p><span className="v2-feature-link">ENTER THE FOREST ↗</span></div><span className="v2-feature-symbol" aria-hidden="true">✳</span></Link>
          </div>
        </div>
      </section>

      <section className="v2-end"><div className="v2-container v2-end-inner"><div><span className="v2-section-index">03 / ONE CONNECTED ECOSYSTEM</span><h2>GO BEYOND<br/><em>THE CHART.</em></h2><p>Explore real WOODY Monitor insights in the Command Center. Built around the official WOODY token on MultiversX.</p></div><Link href="/app" className="v2-end-button">ENTER COMMAND CENTER <span>↗</span></Link></div></section>
      <footer className="v2-footer v2-container"><span>© WOODY ECOSYSTEM</span><span>WOODY-5f9d9c · MULTIVERSX</span><Link href="/forest-adventure">WOODY ARCADE ↗</Link></footer>
    </main>
  );
}
