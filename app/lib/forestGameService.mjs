import { replayForest } from '../forest-adventure/replay.mjs';
import { normalizeWallet } from './forestAuth.mjs';

const EMPTY_PROGRESS = Object.freeze({
  best_score: 0,
  unlocked_level: 1,
  best_times: {},
  boss_wins: 0,
});

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseRun(body) {
  const wallet = normalizeWallet(body?.wallet);
  const id = typeof body?.id === 'string' ? body.id : '';
  const level = body?.level;
  const score = body?.score;
  const durationMs = body?.durationMs;
  const completed = body?.completed;
  if (!wallet || !UUID_V4.test(id) ||
    !Number.isInteger(level) || level < 1 || level > 3 ||
    !Number.isInteger(score) || score < 0 || score > 100000 ||
    !Number.isInteger(durationMs) || durationMs < 1000 || durationMs > 7200000 ||
    typeof completed !== 'boolean') return null;
  return { wallet, id, level, score, durationMs, completed };
}

export function mergeForestProgress(current, run) {
  const times = { ...(current.best_times || {}) };
  if (run.completed) {
    const oldTime = Number(times[run.level]);
    const elapsedSeconds = Math.ceil(run.durationMs / 1000);
    times[run.level] = Number.isFinite(oldTime) && oldTime > 0
      ? Math.min(oldTime, elapsedSeconds)
      : elapsedSeconds;
  }
  return {
    best_score: Math.max(Number(current.best_score) || 0, run.score),
    unlocked_level: Math.max(Number(current.unlocked_level) || 1, run.completed ? Math.min(3, run.level + 1) : 1),
    best_times: times,
    boss_wins: (Number(current.boss_wins) || 0) + Number(run.completed && run.level === 3),
  };
}

function publicProgress(row) {
  return {
    best_score: Number(row?.best_score) || 0,
    unlocked_level: Number(row?.unlocked_level) || 1,
    best_times: row?.best_times || {},
    boss_wins: Number(row?.boss_wins) || 0,
  };
}

export async function getForestProgress(pool, rawWallet) {
  const wallet = normalizeWallet(rawWallet);
  if (!wallet) return { status: 400, body: { error: 'invalid_wallet' } };
  const result = await pool.query(
    'SELECT best_score, unlocked_level, best_times, boss_wins FROM forest_progress WHERE wallet = $1',
    [wallet],
  );
  return { status: 200, body: { progress: publicProgress(result.rows[0] || EMPTY_PROGRESS) } };
}

// Migrate existing, device-local achievements without manufacturing historical
// match results. Imported values stay casual/unverified and never qualify for prizes.
export async function importForestLocalProgress(pool, body) {
  const wallet = normalizeWallet(body?.wallet);
  const bestScore = body?.bestScore;
  const unlockedLevel = body?.unlockedLevel;
  const bossWins = body?.bossWins;
  const rawTimes = body?.bestTimes;
  if (!wallet ||
    !Number.isInteger(bestScore) || bestScore < 0 || bestScore > 100000 ||
    !Number.isInteger(unlockedLevel) || unlockedLevel < 1 || unlockedLevel > 3 ||
    !Number.isInteger(bossWins) || bossWins < 0 || bossWins > 100000 ||
    !rawTimes || typeof rawTimes !== 'object' || Array.isArray(rawTimes)) {
    return { status: 400, body: { error: 'invalid_progress' } };
  }
  const incomingTimes = {};
  for (const level of ['1', '2', '3']) {
    if (rawTimes[level] === undefined) continue;
    const seconds = Number(rawTimes[level]);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 7200) {
      return { status: 400, body: { error: 'invalid_progress' } };
    }
    incomingTimes[level] = seconds;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO forest_progress(wallet)
         SELECT wallet FROM forest_players WHERE wallet = $1
         ON CONFLICT(wallet) DO NOTHING`,
      [wallet],
    );
    const rows = await client.query(
      'SELECT best_score, unlocked_level, best_times, boss_wins FROM forest_progress WHERE wallet = $1 FOR UPDATE',
      [wallet],
    );
    if (!rows.rowCount) {
      await client.query('ROLLBACK');
      return { status: 404, body: { error: 'profile_not_found' } };
    }
    const previous = publicProgress(rows.rows[0]);
    const times = { ...previous.best_times };
    for (const [level,seconds] of Object.entries(incomingTimes)) {
      const existingSeconds = Number(times[level]);
      times[level] = Number.isInteger(existingSeconds) && existingSeconds > 0
        ? Math.min(existingSeconds, seconds) : seconds;
    }
    const progress = {
      best_score: Math.max(previous.best_score, bestScore),
      unlocked_level: Math.max(previous.unlocked_level, unlockedLevel),
      best_times: times,
      boss_wins: Math.max(previous.boss_wins, bossWins),
    };
    await client.query(
      `UPDATE forest_progress
          SET best_score = $2, unlocked_level = $3, best_times = $4::jsonb,
              boss_wins = $5, last_seen_at = now(), updated_at = now()
        WHERE wallet = $1`,
      [wallet, progress.best_score, progress.unlocked_level,
        JSON.stringify(progress.best_times), progress.boss_wins],
    );
    await client.query('COMMIT');
    return { status: 200, body: { ok: true, progress } };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function heartbeatForest(pool, body) {
  const wallet = normalizeWallet(body?.wallet);
  if (!wallet || typeof body?.playing !== 'boolean') {
    return { status: 400, body: { error: 'invalid_request' } };
  }
  const result = await pool.query(
    `INSERT INTO forest_progress(wallet, playing, last_seen_at)
       SELECT wallet, $2, now() FROM forest_players WHERE wallet = $1
       ON CONFLICT(wallet) DO UPDATE SET
         playing = EXCLUDED.playing, last_seen_at = now()
       RETURNING wallet`,
    [wallet, body.playing],
  );
  if (!result.rowCount) return { status: 404, body: { error: 'profile_not_found' } };
  return { status: 200, body: { ok: true } };
}

// Casual game data only. Even replayed results lack wallet ownership proof
// and a server-issued competition session. They are ineligible for prizes.
export async function saveForestRun(pool, body) {
  // Older cached clients can still sync casual rounds. New clients send the
  // inputs so the server can derive scoring, completion and elapsed time.
  const replay = body?.replay === undefined ? undefined : replayForest({
    version: body.replay?.version,
    inputs: body.replay?.inputs,
    level: body.level,
  });
  if (replay === null) return { status: 400, body: { error: 'invalid_replay' } };
  const run = parseRun(replay ? {
    ...body,
    ...replay,
    durationMs: Math.max(1000, replay.durationMs),
  } : body);
  if (!run) return { status: 400, body: { error: 'invalid_run' } };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const profile = await client.query(
      `INSERT INTO forest_progress(wallet)
         SELECT wallet FROM forest_players WHERE wallet = $1
         ON CONFLICT(wallet) DO NOTHING`,
      [run.wallet],
    );
    void profile;
    const existing = await client.query(
      `SELECT best_score, unlocked_level, best_times, boss_wins
         FROM forest_progress WHERE wallet = $1 FOR UPDATE`,
      [run.wallet],
    );
    if (!existing.rowCount) {
      await client.query('ROLLBACK');
      return { status: 404, body: { error: 'profile_not_found' } };
    }
    const duplicate = await client.query(
      'SELECT 1 FROM forest_casual_runs WHERE id = $1 AND wallet = $2',
      [run.id, run.wallet],
    );
    if (duplicate.rowCount) {
      await client.query('COMMIT');
      return { status: 200, body: { ok: true, duplicate: true, progress: publicProgress(existing.rows[0]) } };
    }
    const recent = await client.query(
      `SELECT COUNT(*)::integer AS total FROM forest_casual_runs
        WHERE wallet = $1 AND created_at > now() - interval '1 hour'`,
      [run.wallet],
    );
    if (Number(recent.rows[0]?.total) >= 30) {
      await client.query('ROLLBACK');
      return { status: 429, body: { error: 'too_many_runs' } };
    }
    const inserted = await client.query(
      `INSERT INTO forest_casual_runs(id, wallet, level, score, duration_ms, completed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO NOTHING
         RETURNING id`,
      [run.id, run.wallet, run.level, run.score, run.durationMs, run.completed],
    );
    if (!inserted.rowCount) {
      await client.query('ROLLBACK');
      return { status: 409, body: { error: 'run_id_conflict' } };
    }
    const progress = mergeForestProgress(existing.rows[0], run);
    await client.query(
      `UPDATE forest_progress
          SET best_score = $2, unlocked_level = $3, best_times = $4::jsonb,
              boss_wins = $5, playing = false, last_seen_at = now(),
              updated_at = now()
        WHERE wallet = $1`,
      [run.wallet, progress.best_score, progress.unlocked_level,
        JSON.stringify(progress.best_times), progress.boss_wins],
    );
    await client.query('COMMIT');
    return { status: 201, body: { ok: true, progress } };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
