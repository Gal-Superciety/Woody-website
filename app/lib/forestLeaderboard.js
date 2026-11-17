import { getForestPool } from './forestDb';

export async function getForestLeaderboard(period = 'weekly') {
  const pool = getForestPool();
  // Only saved casual runs are shown. These are NOT server-verified
  // competition scores and must never be used for prize eligibility.
  const window = period === 'all' ? '' :
    "AND r.created_at >= date_trunc('week', now(), 'UTC')";

  const [ranking, summary] = await Promise.all([
    pool.query(
      `SELECT p.username,
              COUNT(r.id)::integer AS games,
              MAX(r.score)::integer AS points,
              COUNT(r.id) FILTER (WHERE r.completed)::integer AS wins
         FROM forest_players p
         JOIN forest_casual_runs r ON r.wallet = p.wallet
        WHERE 1=1 ${window}
        GROUP BY p.wallet, p.username
        ORDER BY MAX(r.score) DESC, COUNT(r.id) DESC, p.username ASC
        LIMIT 100`,
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::integer FROM forest_players) AS profiles,
         (SELECT COUNT(*)::integer FROM forest_casual_runs) AS saved_runs,
         (SELECT COUNT(DISTINCT wallet)::integer FROM forest_casual_runs) AS players_with_runs,
         (SELECT COUNT(*)::integer FROM forest_progress
            WHERE last_seen_at > now() - interval '3 minutes') AS active_now,
         (SELECT COUNT(*)::integer FROM forest_progress
            WHERE playing AND last_seen_at > now() - interval '3 minutes') AS playing_now`,
    ),
  ]);
  return {
    status: 'ok',
    rows: ranking.rows,
    stats: summary.rows[0] || {},
    season: null,
    verification: 'casual_unverified',
  };
}
