import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ECOSYSTEM_TOKENS, normalizeTokenMarket } from '../app/lib/ecosystemTokens.mjs';

test('ecosystem list uses unique MultiversX token identifiers', () => {
  assert.ok(ECOSYSTEM_TOKENS.length >= 4);
  assert.equal(new Set(ECOSYSTEM_TOKENS.map(({ identifier }) => identifier)).size, ECOSYSTEM_TOKENS.length);
  assert.ok(ECOSYSTEM_TOKENS.every(({ identifier }) => /^[A-Z0-9]+-[a-f0-9]{6}$/.test(identifier)));
  assert.ok(ECOSYSTEM_TOKENS.some(({ identifier }) => identifier === 'EAPES-014cd7'));
  assert.ok(!ECOSYSTEM_TOKENS.some(({ identifier }) => identifier === 'RIDE-7d18e9'));
});

test('market API values are normalized without inventing missing numbers', () => {
  const token = ECOSYSTEM_TOKENS[0];
  assert.deepEqual(normalizeTokenMarket(token, { price: '0.000001', accounts: '12', totalVolume24h: null }), {
    ...token,
    name: 'xExchange Token',
    priceUsd: 0.000001,
    marketCapUsd: null,
    holders: 12,
    liquidityUsd: null,
    volume24hUsd: null,
    tradesCount: null,
  });
  assert.equal(normalizeTokenMarket(token, null).priceUsd, null);
});
