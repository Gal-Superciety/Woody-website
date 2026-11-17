import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { UserSecretKey } from '@multiversx/sdk-core';
import {
  getForestProgress, heartbeatForest, importForestLocalProgress, mergeForestProgress, parseRun, saveForestRun,
} from '../app/lib/forestGameService.mjs';

const wallet = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
const run = () => ({ action: 'run', id: randomUUID(), wallet, level: 2, score: 210, durationMs: 60000, completed: true });

test('run validation blocks malformed and oversized submissions', () => {
  const valid = run();
  assert.equal(parseRun(valid)?.wallet, wallet);
  for (const invalid of [
    { ...valid, wallet: 'not-a-wallet' },
    { ...valid, id: 'not-a-uuid' },
    { ...valid, score: 100001 },
    { ...valid, score: -1 },
    { ...valid, score: 12.4 },
    { ...valid, durationMs: 50 },
    { ...valid, level: 4 },
    { ...valid, completed: 'true' },
  ]) assert.equal(parseRun(invalid), null);
});

test('progress unlocks only on a completed level, keeping the best time', () => {
  const first = mergeForestProgress({ best_score: 100, unlocked_level: 1, best_times: {}, boss_wins: 0 }, run());
  assert.deepEqual(first, { best_score: 210, unlocked_level: 3, best_times: { 2: 60 }, boss_wins: 0 });
  const second = mergeForestProgress(first, { ...run(), score: 90, durationMs: 90000, completed: false });
  assert.equal(second.best_score, 210);
  assert.equal(second.unlocked_level, 3);
  assert.deepEqual(second.best_times, { 2: 60 });
  const third = mergeForestProgress(first, { ...run(), level: 3, completed: true });
  assert.equal(third.boss_wins, 1);
});

test('missing progress is returned as defaults, without creating fake games', async () => {
  const pool = { query: async () => ({ rows: [] }) };
  const result = await getForestProgress(pool, wallet);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.progress, { best_score: 0, unlocked_level: 1, best_times: {}, boss_wins: 0 });
});

test('presence requires a known wallet profile', async () => {
  const pool = { query: async () => ({ rowCount: 0 }) };
  assert.equal((await heartbeatForest(pool, { wallet, playing: true })).status, 404);
  assert.equal((await heartbeatForest(pool, { wallet, playing: 'yes' })).status, 400);
});

test('a finished game is saved transactionally and a replay never increases progress', async () => {
  const submission = run();
  const savedIds = new Set();
  let current = { best_score: 0, unlocked_level: 1, best_times: {}, boss_wins: 0 };
  const actions = [];
  const client = {
    async query(sql, params = []) {
      actions.push(sql.trim().split(' ')[0]);
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0 };
      if (sql.includes('INSERT INTO forest_progress')) return { rowCount: 1 };
      if (sql.includes('FROM forest_progress WHERE wallet = $1 FOR UPDATE')) return { rows: [{ ...current }], rowCount: 1 };
      if (sql.includes('SELECT 1 FROM forest_casual_runs')) return { rowCount: savedIds.has(params[0]) ? 1 : 0 };
      if (sql.includes('COUNT(*)::integer AS total')) return { rows: [{ total: savedIds.size }] };
      if (sql.includes('INSERT INTO forest_casual_runs')) { savedIds.add(params[0]); return { rowCount: 1 }; }
      if (sql.includes('UPDATE forest_progress')) {
        current = {
          best_score: params[1],
          unlocked_level: params[2],
          best_times: JSON.parse(params[3]),
          boss_wins: params[4],
        };
        return { rowCount: 1 };
      }
      throw new Error('Unknown query: ' + sql);
    },
    release() {},
  };
  const pool = { connect: async () => client };
  const first = await saveForestRun(pool, submission);
  assert.equal(first.status, 201);
  assert.equal(first.body.progress.best_score, 210);
  const retry = await saveForestRun(pool, submission);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.duplicate, true);
  assert.equal(savedIds.size, 1);
  assert.equal(current.boss_wins, 0);
  assert.equal(actions.filter(action => action === 'COMMIT').length, 2);
});

test('legacy browser records import into cloud idempotently without creating fake runs', async () => {
  let current = { best_score: 25, unlocked_level: 1, best_times: { 1: 45 }, boss_wins: 0 };
  const sqlCalls = [];
  const client = {
    async query(sql, params = []) {
      sqlCalls.push(sql);
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rowCount: 0 };
      if (sql.includes('INSERT INTO forest_progress')) return { rowCount: 0 };
      if (sql.includes('FROM forest_progress WHERE wallet = $1 FOR UPDATE')) {
        return { rowCount: 1, rows: [{ ...current }] };
      }
      if (sql.includes('UPDATE forest_progress')) {
        current = {
          best_score: params[1],
          unlocked_level: params[2],
          best_times: JSON.parse(params[3]),
          boss_wins: params[4],
        };
        return { rowCount: 1 };
      }
      throw new Error('Unexpected SQL');
    },
    release() {},
  };
  const pool = { connect: async () => client };
  const body = {
    wallet, bestScore: 100, unlockedLevel: 2,
    bestTimes: { 1: 60, 2: 78 }, bossWins: 1,
  };
  const first = await importForestLocalProgress(pool, body);
  const second = await importForestLocalProgress(pool, body);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(second.body.progress, {
    best_score: 100, unlocked_level: 2,
    best_times: { 1: 45, 2: 78 }, boss_wins: 1,
  });
  assert.equal(sqlCalls.some(sql => sql.includes('forest_casual_runs')), false);
  assert.equal((await importForestLocalProgress(pool, { ...body, bestTimes: { 1: -10 } })).status, 400);
});
