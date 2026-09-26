export const numberValue = (value) => value === null || value === undefined || value === '' || typeof value === 'boolean' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export function usd(value) {
  const n = numberValue(value);
  if (n === null) return '—';
  if (n > 0 && n < 0.00000001) return `$${n.toExponential(2)}`;
  if (n > 0 && n < 0.01) return `$${n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
export const plain = (value) => numberValue(value) === null ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
export function isFresh(data, now = Date.now()) {
  const timestamp = numberValue(data?.updatedAt);
  if (!timestamp || data?.available === false || data?.freshness?.stale === true) return false;
  const age = now / 1000 - timestamp;
  return age >= -60 && age <= 120;
}
export function readablePools(data) {
  const seen = new Set();
  return (Array.isArray(data?.liquidity?.pools) ? data.liquidity.pools : []).filter(pool => {
    if (pool?.status === 'unavailable' || !(numberValue(pool?.woodyReserve) > 0) || !(numberValue(pool?.quoteReserve) > 0)) return false;
    const key = pool.address || `${pool.dex}:${pool.pair}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
