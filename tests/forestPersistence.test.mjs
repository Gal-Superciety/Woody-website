import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueForestRun, flushForestRuns, readPendingRuns, FOREST_PENDING_RUNS_KEY } from '../app/lib/forestPersistence.mjs';

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('finished game remains queued when network is unavailable', async () => {
  const saved = storage();
  const run = { id: 'one', wallet: 'wallet1', level: 1 };
  enqueueForestRun(saved, run);
  enqueueForestRun(saved, run);
  assert.equal(readPendingRuns(saved).length, 1);
  await assert.rejects(flushForestRuns(saved, 'wallet1', async () => { throw new Error('offline'); }));
  assert.equal(readPendingRuns(saved).length, 1);
});

test('acknowledged game is removed after successful backend response', async () => {
  const saved = storage();
  enqueueForestRun(saved, { id: 'one', wallet: 'wallet1' });
  enqueueForestRun(saved, { id: 'two', wallet: 'wallet2' });
  const progress = await flushForestRuns(saved, 'wallet1', async (url, request) => {
    assert.equal(url, '/api/forest/progress');
    assert.equal(JSON.parse(request.body).action, 'run');
    return { ok: true, json: async () => ({ ok: true, progress: { best_score: 120 } }) };
  });
  assert.equal(progress.best_score, 120);
  assert.deepEqual(readPendingRuns(saved).map(row => row.id), ['two']);
  assert.equal(typeof saved.getItem(FOREST_PENDING_RUNS_KEY), 'string');
});
