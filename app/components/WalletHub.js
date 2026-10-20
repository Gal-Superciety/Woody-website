'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usd } from '../lib/monitor';
import { formatTokenUnits, normalizeWalletSnapshot, tokenUnits } from '../lib/walletHub.mjs';

const EXPLORER_URL = process.env.NEXT_PUBLIC_MULTIVERSX_EXPLORER_URL || 'https://explorer.multiversx.com';
const shortAddress = (address = '') => address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '—';

export default function WalletHub({ address }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllAssets, setShowAllAssets] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/wallet-hub?address=${encodeURIComponent(address)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Wallet data is unavailable.');
      setSnapshot(payload);
    } catch (loadError) {
      setError(loadError.message || 'Wallet data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const data = useMemo(() => normalizeWalletSnapshot(snapshot, address), [snapshot, address]);
  const holdings = useMemo(() => [...data.holdings].sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1)), [data.holdings]);
  const visibleHoldings = showAllAssets ? holdings : holdings.slice(0, 10);
  const egld = tokenUnits(snapshot?.balance, 18);
  const egldValue = egld != null && snapshot?.egldPriceUsd != null ? egld * snapshot.egldPriceUsd : null;
  const totalValue = data.holdings.reduce((total, token) => total + (token.valueUsd ?? 0), egldValue ?? 0);
  const pricedAssets = data.holdings.filter((token) => token.valueUsd != null).length + (egldValue != null ? 1 : 0);
  const unpricedAssets = data.holdings.filter((token) => token.valueUsd == null).length;

  return <section id="wallet-hub" className="wallet-hub" aria-label="Wallet portfolio and activity">
    <div className="wallet-hub-heading">
      <div><p className="section-eyebrow">YOUR ON-CHAIN DASHBOARD</p><h3>Portfolio & activity</h3><p>Read-only data from the connected MultiversX address.</p></div>
      <button type="button" onClick={refresh} disabled={loading} className="cta cta-blue">{loading ? 'Refreshing…' : 'Refresh portfolio'}</button>
    </div>

    {error ? <p className="feed-message" role="status">{error}</p> : <>
      <article className="wallet-portfolio-total">
        <div><span>Estimated portfolio value</span><strong>{loading && !snapshot ? '…' : usd(totalValue)}</strong><small>{pricedAssets} priced assets{unpricedAssets ? ` · ${unpricedAssets} without a USD price` : ''}</small></div>
        <span className="wallet-readonly-badge">READ ONLY</span>
      </article>

      <div className="wallet-hub-columns">
        <section className="wallet-hub-panel" aria-label="Token holdings">
          <div className="wallet-hub-panel-heading"><h4>Assets</h4><span>{loading && !snapshot ? 'Loading…' : `${data.holdings.length + (egld != null ? 1 : 0)} tracked`}</span></div>
          <div className="wallet-assets-list">
            {egld != null && <article className="wallet-asset-row">
              <div className="wallet-asset-icon">Ξ</div><div className="wallet-asset-name"><strong>EGLD</strong><span>MultiversX</span></div>
              <div className="wallet-asset-value"><strong>{formatTokenUnits(snapshot.balance, 18)}</strong><span>{usd(egldValue)}</span></div>
            </article>}
            {visibleHoldings.map((token) => <article className="wallet-asset-row" key={token.identifier}>
              <div className="wallet-asset-icon">{token.symbol.slice(0, 1)}</div><div className="wallet-asset-name"><a href={`${EXPLORER_URL}/tokens/${encodeURIComponent(token.identifier)}`} target="_blank" rel="noopener noreferrer"><strong>{token.symbol}</strong></a><span>{token.name}</span></div>
              <div className="wallet-asset-value"><strong>{formatTokenUnits(token.balanceRaw, token.decimals)}</strong><span>{usd(token.valueUsd)}</span></div>
            </article>)}
            {!loading && egld == null && data.holdings.length === 0 && <p className="wallet-empty">No assets were returned for this wallet.</p>}
          </div>
          {holdings.length > 10 && <button type="button" className="wallet-show-assets" onClick={() => setShowAllAssets((shown) => !shown)}>{showAllAssets ? 'Show fewer assets' : `Show all ${holdings.length} assets`}</button>}
          <p className="wallet-hub-note">USD amounts are estimates from MultiversX API prices. The API returns up to 100 token records; unpriced tokens show —.</p>
        </section>

        <section className="wallet-hub-panel" aria-label="Recent wallet activity">
          <div className="wallet-hub-panel-heading"><h4>Recent activity</h4><span>Latest 10</span></div>
          <div className="wallet-activity-list">
            {data.transactions.map((transaction) => <article className="wallet-activity-row" key={transaction.hash}>
              <div className={`wallet-activity-direction ${transaction.direction.toLowerCase()}`}>{transaction.direction === 'Received' ? '↓' : transaction.direction === 'Sent' ? '↑' : '↗'}</div>
              <div className="wallet-activity-main"><strong>{transaction.kind}</strong><span>{transaction.direction} · {transaction.description}</span><small>{new Date(transaction.timestamp).toLocaleString()}</small></div>
              <a href={`${EXPLORER_URL}/transactions/${transaction.hash}`} target="_blank" rel="noopener noreferrer" aria-label="Open transaction in MultiversX Explorer">↗</a>
            </article>)}
            {!loading && data.transactions.length === 0 && <p className="wallet-empty">No recent activity was returned for this wallet.</p>}
          </div>
          <p className="wallet-hub-note">A wallet transfer is labeled “Transfer.” Swap labels appear only when the indexed action identifies a swap.</p>
        </section>
      </div>
    </>}
  </section>;
}
