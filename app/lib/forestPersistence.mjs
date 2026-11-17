export const FOREST_PENDING_RUNS_KEY = 'woody-forest-pending-runs-v1';

export function readPendingRuns(storage) {
  try {
    const rows = JSON.parse(storage.getItem(FOREST_PENDING_RUNS_KEY) || '[]');
    return Array.isArray(rows) ? rows.filter(row => row && typeof row.id === 'string').slice(-30) : [];
  } catch {
    return [];
  }
}

export function enqueueForestRun(storage, run) {
  const pending = readPendingRuns(storage);
  if (!pending.some(item => item.id === run.id)) pending.push(run);
  storage.setItem(FOREST_PENDING_RUNS_KEY, JSON.stringify(pending.slice(-30)));
}

// Keep unsent games on this device until the server acknowledges their UUID.
// Same UUID is idempotent server-side, so network retries never award duplicates.
export async function flushForestRuns(storage, wallet, fetcher = fetch) {
  let latestProgress = null;
  for (const run of readPendingRuns(storage).filter(row => row.wallet === wallet)) {
    const response = await fetcher('/api/forest/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ...run, action: 'run' }),
    });
    if (!response.ok) throw new Error('save_failed_' + response.status);
    const body = await response.json();
    if (!body.ok) throw new Error('save_unconfirmed');
    const remaining = readPendingRuns(storage).filter(row => row.id !== run.id);
    storage.setItem(FOREST_PENDING_RUNS_KEY, JSON.stringify(remaining));
    if (body.progress) latestProgress = body.progress;
  }
  return latestProgress;
}
