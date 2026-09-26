'use client';

import Link from 'next/link';
import { useMonitor } from '../lib/useMonitor';
import { usd, plain, readablePools } from '../lib/monitor';
import MonitorStatus from '../components/MonitorStatus';

const explanations = {
  pulse: 'A 0–100 indicator combining monitored buy/sell flows, pool visibility and recent activity. Higher means stronger positive activity; it does not predict future price.',
  risk: 'A 0–100 score of detected risk markers: sell pressure, large sells, missing pool data, feed instability and holder decline. Higher means more markers. LOW is not a safety guarantee.',
  accumulation: 'A 0–100 indicator based on monitored buying, selling, wallet flows and liquidity. It is a rule-based signal, not a probability of profit.',
  wallets: 'A rule-based summary of observed market and wallet activity. Its confidence is an indicator score, not a statistically calibrated probability.',
  pump: 'A 0–100 risk-marker score, not confidence that momentum is healthy. Higher means more unusual volume, wallet repetition or unstable flows. Sparse activity limits what can be concluded.',
};

export default function CommandCenter({ children }) {
  const { data, status, live, refreshing, refresh } = useMonitor();
  const pools = readablePools(data);
  const unavailable = data?.liquidity?.pools?.filter(pool => pool.status === 'unavailable') || [];
  const signals = [
    { key: 'pulse', title: 'Market Pulse', value: data?.marketPulse?.mood, score: data?.marketPulse?.score, detail: data?.marketPulse?.activity ? `${data.marketPulse.activity} activity · last 24h` : '', reasons: data?.marketPulse?.reasons, samples: data?.marketPulse?.sampleCount },
    { key: 'risk', title: 'Risk Radar', value: data?.riskRadar?.level, score: data?.riskRadar?.score, detail: 'Detected risk markers · last 24h', reasons: data?.riskRadar?.detected, samples: data?.riskRadar?.sampleCount },
    { key: 'accumulation', title: 'Accumulation', value: data?.accumulation?.level, score: data?.accumulation?.confidence, detail: 'Accumulation indicator · last 24h' },
    { key: 'wallets', title: 'Wallet Intelligence', value: data?.walletIntelligence?.signal, score: data?.walletIntelligence?.confidence, detail: data?.walletIntelligence?.reason },
    { key: 'pump', title: 'Pump Risk Markers', value: (data?.fakePump?.riskScore ?? data?.fakePump?.confidence) < 45 ? 'Few markers detected' : data?.fakePump?.status, score: data?.fakePump?.riskScore ?? data?.fakePump?.confidence, detail: 'Higher score = more risk markers', samples: data?.fakePump?.sampleCount },
  ];
  const metrics = [
    ['WOODY price', usd(data?.price?.usd), 'USD reference price'],
    ['Pool liquidity', usd(data?.liquidity?.totalUsd), `${data?.liquidity?.estimatedPoolCount ?? '—'} readable pools · estimated`],
    ['Holders', plain(data?.holders?.count ?? data?.holders), 'Accounts holding WOODY'],
    ['Tracked volume · 24h', usd(data?.volume24hUsd), data?.volume?.tradeCount != null ? `${plain(data.volume.tradeCount)} detected trades` : 'WOODY Monitor detected trades'],
  ];

  return <>
    <header className="dashboard-heading">
      <div><p className="section-eyebrow">WOODY / MARKET INTELLIGENCE</p><h1>Command Center<span>.</span></h1><p>Your market snapshot, wallet and pool reserves. In one place.</p></div>
      <Link href="/buy" className="cta cta-orange">Buy WOODY ↗</Link>
    </header>
    <nav className="dashboard-tabs" aria-label="Command Center sections"><a href="#overview">Overview</a><a href="#wallet">Wallet</a><a href="#signals">Signals</a><a href="#pools">Pool reserves</a></nav>
    <section id="overview" className="dashboard-section" aria-label="Market overview">
      <MonitorStatus status={status} updatedAt={data?.updatedAt} refreshing={refreshing} refresh={refresh} />
      <div className="market-overview">{metrics.map(([label,value,note]) => <article key={label}><p>{label}</p><strong>{status === 'loading' ? '…' : value}</strong><span>{note}</span></article>)}</div>
      {!live && status !== 'loading' && <p className="feed-message">The Monitor is temporarily unavailable or its data is too old. Values are hidden until a fresh snapshot arrives. Try Refresh.</p>}
      <p className="data-caption">Automatic refresh every 30 seconds. Volume covers detected trades; liquidity is an estimate, not independently verified USD TVL.</p>
    </section>
    <section id="wallet" className="dashboard-section wallet-section">{children}</section>
    <section id="signals" className="dashboard-section">
      <div className="section-heading-row"><div><p className="section-eyebrow">UNDERSTAND THE ACTIVITY</p><h2>Market signals</h2></div><span className="subtle-label">Rule-based · 24h window</span></div>
      <div className="signal-grid">{signals.map(signal => <article className="signal-card" key={signal.key}>
        <div className="signal-card-top"><h3>{signal.title}</h3><span>{live && signal.score != null ? `${signal.score}/100` : '—'}</span></div>
        <p className="signal-value">{live ? signal.samples === 0 ? 'No recent trades' : signal.value || 'Unavailable' : 'Awaiting data'}</p>
        <p className="signal-detail">{live ? signal.detail : 'A fresh Monitor snapshot is required.'}</p>
        <details><summary>How to read this</summary><p>{explanations[signal.key]}</p>{signal.reasons?.length > 0 && <ul>{signal.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}{signal.samples != null && <p>{signal.samples} monitored trades in this window.</p>}</details>
      </article>)}</div>
    </section>
    <section id="pools" className="dashboard-section">
      <div className="section-heading-row"><div><p className="section-eyebrow">LIQUIDITY / ON-CHAIN RESERVES</p><h2>Across the ecosystem</h2></div><div className="pool-total"><strong>{usd(data?.liquidity?.totalUsd)}</strong><span>estimated total · {data?.liquidity?.estimatedPoolCount ?? '—'} pools</span></div></div>
      <details className="method-note"><summary>How the liquidity estimate is calculated</summary><p>For each readable pool: 2 × WOODY reserve × the Monitor WOODY USD reference price. The total is the sum of those pool estimates. Quote-token USD prices are not independently valued. Unavailable pools are excluded.</p></details>
      {live && pools.length ? <div className="pool-grid">{pools.map(pool => <article className="pool-card" key={pool.address || `${pool.dex}:${pool.pair}`}>
        <div className="pool-card-head"><span>{pool.dex}</span><strong>{pool.pair}</strong></div>
        <p className="pool-value">{usd(pool.estimatedUsd ?? (data.price.usd > 0 ? 2 * pool.woodyReserve * data.price.usd : null))}<span>estimated</span></p>
        <dl><div><dt>WOODY</dt><dd>{plain(pool.woodyReserve)}</dd></div><div><dt>{pool.quoteSymbol}</dt><dd>{plain(pool.quoteReserve)}</dd></div></dl>
        {pool.address && <a className="pool-explorer" href={`https://explorer.multiversx.com/accounts/${encodeURIComponent(pool.address)}`} target="_blank" rel="noopener noreferrer">View pool account ↗</a>}
      </article>)}</div> : <p className="feed-message">{status === 'loading' ? 'Loading pool reserves…' : 'Readable pool reserves are currently unavailable.'}</p>}
      {unavailable.length > 0 && <details className="method-note"><summary>{unavailable.length} pools excluded — data unavailable</summary>{unavailable.map((pool,i) => <p key={pool.address || i}>{pool.dex} · {pool.pair}: {pool.reason || 'Unavailable'}</p>)}</details>}
    </section>
    <section className="arcade-strip"><div><p className="section-eyebrow">TAKE A BREAK / WOODY ARCADE</p><h2>Into the forest.</h2><p>Three levels. One final boss. Free to play, no wallet needed.</p></div><Link href="/forest-adventure" className="cta cta-blue">Play Forest Adventure ↗</Link></section>
  </>;
}
