'use client';

import { useEffect, useState } from 'react';
import { plain, usd } from '../lib/monitor';

function metric(value, formatter) {
  return value == null ? '—' : formatter(value);
}

export default function EcosystemTokenBoard() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/ecosystem-tokens', { cache: 'no-store' });
        if (!response.ok) throw new Error('Market data unavailable');
        const payload = await response.json();
        if (active) {
          setTokens(Array.isArray(payload.tokens) ? payload.tokens : []);
          setUnavailable(false);
        }
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return <section id="ecosystem" className="dashboard-section" aria-label="MultiversX ecosystem tokens">
    <div className="section-heading-row">
      <div><p className="section-eyebrow">MULTIVERSX / TOKEN RADAR</p><h2>Explore the ecosystem</h2></div>
      <span className="subtle-label">Market data · refreshes every minute</span>
    </div>
    <p className="data-caption">A live snapshot of established MultiversX tokens. Price, market cap, holders, liquidity, volume and trade count come from the MultiversX API. WOODY’s wallet flow and risk signals remain specific to WOODY.</p>
    {unavailable && tokens.length === 0 ? <p className="feed-message">Token market data is temporarily unavailable.</p> : <div className="token-board-grid">
      {tokens.map(token => <article className="token-board-card" key={token.identifier}>
        <div className="token-board-top"><div><p>{token.symbol}</p><h3>{token.name}</h3></div><a href={`https://explorer.multiversx.com/tokens/${encodeURIComponent(token.identifier)}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${token.symbol} on MultiversX Explorer`}>↗</a></div>
        <strong className="token-board-price">{loading ? '…' : metric(token.priceUsd, usd)}<span> USD</span></strong>
        <dl>
          <div><dt>Market cap</dt><dd>{metric(token.marketCapUsd, usd)}</dd></div>
          <div><dt>Holders</dt><dd>{metric(token.holders, plain)}</dd></div>
          <div><dt>Liquidity</dt><dd>{metric(token.liquidityUsd, usd)}</dd></div>
          <div><dt>Volume · 24h</dt><dd>{metric(token.volume24hUsd, usd)}</dd></div>
          <div><dt>Trades · all time</dt><dd>{metric(token.tradesCount, plain)}</dd></div>
        </dl>
      </article>)}
    </div>}
    <p className="data-caption">This board is for discovery and comparison, not a buy or sell recommendation. Token API coverage and reported activity can vary.</p>
  </section>;
}
