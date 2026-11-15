import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWalletReturnPath, safeWalletReturnPath } from '../app/lib/walletRoutes.mjs';

test('returns to the requested WOODY game, not automatically to Command Center', () => {
  assert.equal(resolveWalletReturnPath({
    requested: '/forest-adventure', pending: '/profile', current: '/app',
  }), '/forest-adventure');
  assert.equal(resolveWalletReturnPath({ current: '/profile' }), '/profile');
});
test('rejects remote or lookalike redirect destinations', () => {
  for (const target of ['https://example.com', '//example.com', '/profile?next=//evil',
    '/%2F%2Fevil', '/forest-adventure/../buy', '/random']) {
    assert.equal(safeWalletReturnPath(target), '');
  }
  assert.equal(resolveWalletReturnPath({ requested: '//evil', current: '/app' }), '/app');
});
