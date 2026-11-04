import test from 'node:test';
import assert from 'node:assert/strict';
import { UserSecretKey } from '@multiversx/sdk-core';
import { registerForestProfile } from '../app/lib/forestProfileService.mjs';

const wallet = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
const input = { wallet, username: 'Woody_Player' };
const unavailable = () => { throw new Error('database must not be called'); };

for (const [name, body] of [
  ['missing payload', null],
  ['invalid wallet', { ...input, wallet: 'fake' }],
  ['short name', { ...input, username: 'ab' }],
  ['long name', { ...input, username: 'x'.repeat(21) }],
  ['invalid name characters', { ...input, username: '<script>' }],
]) {
  test(`profile rejects ${name} before a database write`, async () => {
    const result = await registerForestProfile(body, { pool: unavailable });
    assert.equal(result.status, 400);
  });
}

test('connected wallet can save a profile without a login signature', async () => {
  let writes = 0;
  const result = await registerForestProfile({ ...input, username: ' Woody_Player ' }, {
    pool: () => ({
      query: async (sql, params) => {
        writes += 1;
        assert.match(sql, /VALUES \(\$1, \$2\)/);
        assert.deepEqual(params, [wallet, 'Woody_Player']);
        return { rows: [input] };
      },
    }),
  });
  assert.equal(writes, 1);
  assert.equal(result.status, 201);
  assert.deepEqual(result.body.profile, input);
});

for (const [constraint, expected] of [
  ['forest_players_username_ci', 'username_taken'],
  ['forest_players_username_key', 'username_taken'],
  ['forest_players_pkey', 'profile_already_exists'],
]) {
  test(`duplicate ${constraint} produces a recoverable conflict`, async () => {
    const result = await registerForestProfile(input, {
      pool: () => ({ query: async () => { throw { code: '23505', constraint }; } }),
    });
    assert.equal(result.status, 409);
    assert.equal(result.body.error, expected);
  });
}

test('database failure never reports a saved profile or leaks database details', async () => {
  const result = await registerForestProfile(input, {
    pool: () => { throw new Error('postgres://private'); },
  });
  assert.deepEqual(result, { status: 503, body: { error: 'profile_service_unavailable' } });
});
