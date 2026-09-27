import 'server-only';
import { Pool } from 'pg';

let pool;
function db() {
  if (!process.env.FOREST_DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.FOREST_DATABASE_URL, max: 3 });
  return pool;
}
export async function getForestLeaderboard(period = 'weekly') {
  const client = db();
  if (!client) return { status: 'setup', rows: [], season: null };
  if (period === 'weekly') {
    const { rows: seasons } = await client.query(
      "SELECT id,starts_at,ends_at,status FROM forest_seasons WHERE starts_at <= now() ORDER BY starts_at DESC LIMIT 1"
    );
    if (!seasons.length) return { status: 'no-season', rows: [], season: null };
    const season = seasons[0];
    const { rows } = await client.query(
      `SELECT p.username, COUNT(*)::int AS games, COALESCE(SUM(r.score),0)::bigint::text AS points
       FROM forest_runs r JOIN forest_players p ON p.wallet=r.wallet
       WHERE r.season_id=$1 AND r.verification_status='verified'
       GROUP BY p.wallet,p.username ORDER BY SUM(r.score) DESC, COUNT(*) DESC, p.username ASC LIMIT 100`, [season.id]
    );
    return { status: 'ok', rows, season };
  }
  const { rows } = await client.query(
    `SELECT p.username, COUNT(*)::int AS games, COALESCE(SUM(r.score),0)::bigint::text AS points
     FROM forest_runs r JOIN forest_players p ON p.wallet=r.wallet
     WHERE r.verification_status='verified'
     GROUP BY p.wallet,p.username ORDER BY SUM(r.score) DESC, COUNT(*) DESC, p.username ASC LIMIT 100`
  );
  return { status: 'ok', rows, season: null };
}
