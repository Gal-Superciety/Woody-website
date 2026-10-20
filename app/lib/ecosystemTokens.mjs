export const ECOSYSTEM_TOKENS = [
  { identifier: 'MEX-455c57', symbol: 'MEX', name: ' xExchange Token' },
  { identifier: 'RIDE-7d18e9', symbol: 'RIDE', name: 'holoride' },
  { identifier: 'BOBER-9eb764', symbol: 'BOBER', name: 'BOBER' },
  { identifier: 'WEGLD-bd4d79', symbol: 'WEGLD', name: 'Wrapped EGLD' },
];

export function normalizeTokenMarket(token, payload) {
  const numeric = (value) => {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    ...token,
    name: payload?.name || token.name.trim(),
    priceUsd: numeric(payload?.price),
    marketCapUsd: numeric(payload?.marketCap),
    holders: numeric(payload?.accounts),
    liquidityUsd: numeric(payload?.totalLiquidity),
    volume24hUsd: numeric(payload?.totalVolume24h),
    tradesCount: numeric(payload?.tradesCount),
  };
}
