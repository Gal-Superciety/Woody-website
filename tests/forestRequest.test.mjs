import test from 'node:test';
import assert from 'node:assert/strict';
import { forestRequest } from '../app/lib/forestRequest.mjs';
test('stalled profile requests time out and abort their transport', async () => {
  let signal;
  await assert.rejects(forestRequest('/profile', {}, 10, async (_, options) => {
    signal = options.signal;
    return new Promise(() => {});
  }), /profile_request_timeout/);
  assert.equal(signal.aborted, true);
});
test('the deadline also covers a stalled response body', async () => {
  await assert.rejects(forestRequest('/profile', {}, 10, async () => ({ ok: true, json: () => new Promise(() => {}) })), /profile_request_timeout/);
});
test('profile requests preserve successful results and specific errors', async () => {
  assert.deepEqual(await forestRequest('/profile', {}, 100, async () => ({ ok: true, json: async () => ({ profile: { username: 'WOODY' } }) })), { profile: { username: 'WOODY' } });
  await assert.rejects(forestRequest('/profile', {}, 100, async () => ({ ok: false, json: async () => ({ error: 'username_taken' }) })), /username_taken/);
});
