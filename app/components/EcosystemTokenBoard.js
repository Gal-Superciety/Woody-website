'use client';

import { useEffect, useRef, useState } from 'react';
import { plain, usd } from '../lib/monitor';

function metric(value, formatter) {
  return value == null ? '—' : formatter(value);
}

export default function EcosystemTokenBoard() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [query, setQuery] = useState('');
  const pickerRef = useRef(null);

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

  const selectedToken = tokens.find(token => token.identifier === selectedIdentifier) || tokens[0];
  const filteredTokens = tokens.filter(token => `${token.symbol} ${token.name}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <section id="ecosystem" className="dashboard-section" aria-label="MultiversX ecosystem tokens">
    <div className="section-heading-row">
      <div><p className="section-eyebrow">MULTIVERSX / TOKEN RADAR</p><h2>Explore the ecosystem</h2></div>
      <span className="subtle-label">Market data · refreshes every minute</span>
    </div>
    <p className="data-caption">A live snapshot of established MultiversX tokens. Price, market cap, holders, liquidity, volume and trade count come from the MultiversX API. WOODY’s wallet flow and risk signals remain specific to WOODY.</p>
    {unavailable && tokens.length === 0 ? <p className="feed-message">Token market data is temporarily unavailable.</p> : tokens.length > 0 ? <>
      <div className="token-picker-wrap">
        <details className="token-picker" ref={pickerRef}>
          <summary aria-label={selectedToken ? `Choose token. Selected: ${selectedToken.symbol}` : 'Choose a token'}>
            <span className="token-picker-label">Token information</span>
            <strong>{selectedToken ? `${selectedToken.symbol} · ${selectedToken.name}` : loading ? 'Loading tokens…' : 'Choose a token'}</strong>
            <span className="token-picker-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="token-picker-panel">
            <label className="token-picker-search">Find a token<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or symbol" /></label>
            <div className="token-picker-options" aria-label="Available MultiversX tokens">
              {filteredTokens.map(token => <button type="button" aria-pressed={token.identifier === selectedToken?.identifier} key={token.identifier} onClick={() => { setSelectedIdentifier(token.identifier); setQuery(''); if (pickerRef.current) pickerRef.current.open = false; }}>
                <span><strong>{token.symbol}</strong><small>{token.name}</small></span><span aria-hidden="true">↗</span>
              </button>)}
              {filteredTokens.length === 0 && <p className="token-picker-empty">No tokens match that search.</p>}
            </div>
          </div>
        </details>
      </div>
      {selectedToken && <div className="token-board-grid">
        <article className="token-board-card" key={selectedToken.identifier}>
          <div className="token-board-top"><div><p>{selectedToken.symbol}</p><h3>{selectedToken.name}</h3></div><a href={`https://explorer.multiversx.com/tokens/${encodeURIComponent(selectedToken.identifier)}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${selectedToken.symbol} on MultiversX Explorer`}>↗</a></div>
          <strong className="token-board-price">{loading ? '…' : metric(selectedToken.priceUsd, usd)}<span> USD</span></strong>
          <dl>
            <div><dt>Market cap</dt><dd>{metric(selectedToken.marketCapUsd, usd)}</dd></div>
            <div><dt>Holders</dt><dd>{metric(selectedToken.holders, plain)}</dd></div>
            <div><dt>Liquidity</dt><dd>{metric(selectedToken.liquidityUsd, usd)}</dd></div>
            <div><dt>Volume · 24h</dt><dd>{metric(selectedToken.volume24hUsd, usd)}</dd></div>
            <div><dt>Trades · all time</dt><dd>{metric(selectedToken.tradesCount, plain)}</dd></div>
          </dl>
        </article>
      </div>}
    </> : <p className="feed-message">{loading ? 'Loading token market data…' : 'No token market data is available right now.'}</p>}
    <p className="data-caption">This board is for discovery and comparison, not a buy or sell recommendation. Token API coverage and reported activity can vary.</p>
  </section>;
}
