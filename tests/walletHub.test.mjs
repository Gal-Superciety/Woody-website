import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyActivity, formatTokenUnits, normalizeWalletSnapshot, tokenUnits } from '../app/lib/walletHub.mjs';

const wallet = 'erd1deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaqtv0gag';

test('token raw balances are converted using their decimals', () => {
  assert.equal(tokenUnits('1250000', 6), 1.25);
  assert.equal(tokenUnits('1000000000000000000'), 1);
  assert.equal(tokenUnits('bad', 18), null);
  assert.equal(formatTokenUnits('1234567890000000000', 18), '1.23456789');
  assert.equal(formatTokenUnits('bad', 18), '—');
});

test('wallet transfer activity is never mislabeled as a swap or sale', () => {
  assert.deepEqual(classifyActivity({
    sender: wallet,
    receiver: 'erd1qzzpqdhc60xgymqje3udgrlzc8g5kzpyunu3e8rdgfvzhafra9dqlsrrsa',
    action: { name: 'transfer', description: 'Transfer' },
  }, wallet), { kind: 'Transfer', direction: 'Sent' });
});

test('explicit swap and incoming transfer actions are categorized from indexed metadata', () => {
  assert.deepEqual(classifyActivity({ sender: wallet, receiver: 'erd1contract', action: { name: 'swapTokensFixedInput' } }, wallet), { kind: 'Swap', direction: 'Sent' });
  assert.deepEqual(classifyActivity({ receiver: wallet, sender: 'erd1sender', action: { name: 'ESDTTransfer', description: 'Transfer' } }, wallet), { kind: 'Transfer', direction: 'Received' });
});

test('portfolio ignores NFT holdings and keeps token estimates only when price is known', () => {
  const result = normalizeWalletSnapshot({ tokens: [
    { type: 'FungibleESDT', identifier: 'EAPES-014cd7', name: 'EAPES', ticker: 'EAPES', balance: '2000000000000000000', decimals: 18, price: 0.05 },
    { type: 'NonFungibleESDT', identifier: 'ART-123456-01', balance: '1', decimals: 0, price: 10 },
    { type: 'FungibleESDT', identifier: 'NOPRICE-123abc', balance: '100', decimals: 0 },
  ] }, wallet);
  assert.equal(result.holdings.length, 2);
  assert.equal(result.holdings[0].valueUsd, 0.1);
  assert.equal(result.holdings[1].valueUsd, null);
});
