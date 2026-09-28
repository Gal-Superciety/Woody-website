import { getForestPool } from './forestDb';

export async function getForestLeaderboard(period = 'weekly') {
  const pool = getForestPool();

  if (period === 'all') {
    const result = await pool.query(
      `SELECT p.username, COUNT(r.id)::integer AS games, SUM(r.score)::bigint AS points
         FROM forest_players p
         JOIN forest_runs r ON r.wallet = p.wallet
        WHERE r.verification_status = 'verified'
        GROUP BY p.wallet, p.username
        ORDER BY SUM(r.score) DESC, COUNT(r.id) DESC, p.username ASC
        LIMIT 100`,
    );
    return { status: 'ok', rows: result.rows, season: null };
  }

  const seasons = await pool.query(
    `SELECT id, starts_at, ends_at, status
       FROM forest_seasons
      WHERE starts_at <= now() AND ends_at > now() AND status = 'open'
      ORDER BY starts_at DESC
      LIMIT 1`,
  );
  const season = seasons.rows[0] || null;
  if (!season) return { status: 'no-season', rows: [], season: null };

  const result = await pool.query(
    `SELECT p.username, COUNT(r.id)::integer AS games, SUM(r.score)::bigint AS points
       FROM forest_players p
       JOIN forest_runs r ON r.wallet = p.wallet
      WHERE r.season_id = $1 AND r.verification_status = 'verified'
      GROUP BY p.wallet, p.username
      ORDER BY SUM(r.score) DESC, COUNT(r.id) DESC, p.username ASC
      LIMIT 100`,
    [season.id],
  );

  return { status: 'ok', rows: result.rows, season };
}
