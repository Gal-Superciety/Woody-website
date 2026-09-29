import { normalizeWallet, USERNAME_PATTERN } from './forestAuth.mjs';

export async function registerForestProfile(body, token, { verify, pool }) {
  const wallet = normalizeWallet(body?.wallet);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  if (!wallet || !USERNAME_PATTERN.test(username)) return { status: 400, body: { error: 'invalid_request' } };
  if (!token) return { status: 401, body: { error: 'invalid_native_auth' } };
  let verified;
  try { verified = await verify(token); }
  catch { return { status: 503, body: { error: 'profile_service_unavailable' } }; }
  if (verified !== wallet) return { status: 401, body: { error: 'invalid_native_auth' } };
  try {
    const inserted = await pool().query(
      `INSERT INTO forest_players (wallet, username)
       VALUES ($1, $2)
       RETURNING wallet, username, created_at`,
      [wallet, username],
    );
    return { status: 201, body: { profile: inserted.rows[0] } };
  } catch (error) {
    if (error?.code === '23505' && ['forest_players_username_ci', 'forest_players_username_key'].includes(error.constraint)) {
      return { status: 409, body: { error: 'username_taken' } };
    }
    if (error?.code === '23505' && error.constraint === 'forest_players_pkey') {
      return { status: 409, body: { error: 'profile_already_exists' } };
    }
    return { status: 503, body: { error: 'profile_service_unavailable' } };
  }
}
