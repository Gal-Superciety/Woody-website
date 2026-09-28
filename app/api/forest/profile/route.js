import { NextResponse } from 'next/server';
import { getForestPool } from '../../../lib/forestDb';
import { normalizeWallet, USERNAME_PATTERN, verifyForestWalletSignature } from '../../../lib/forestAuth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const wallet = normalizeWallet(new URL(request.url).searchParams.get('wallet'));
  if (!wallet) return NextResponse.json({ error: 'invalid_wallet' }, { status: 400 });

  try {
    const result = await getForestPool().query(
      'SELECT wallet, username, created_at FROM forest_players WHERE wallet = $1',
      [wallet],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
    return NextResponse.json({ profile: result.rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Forest profile could not be loaded', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const wallet = normalizeWallet(body?.wallet);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const challengeId = typeof body?.challengeId === 'string' ? body.challengeId : '';
  const signature = typeof body?.signature === 'string' ? body.signature : '';
  if (!wallet || !USERNAME_PATTERN.test(username) || !/^[0-9a-f-]{36}$/i.test(challengeId) || !/^[0-9a-f]{128}$/i.test(signature)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  let client;
  try {
    client = await getForestPool().connect();
  } catch (error) {
    console.error('Forest profile database is unavailable', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  }

  try {
    await client.query('BEGIN');
    const challengeResult = await client.query(
      `SELECT wallet, username, challenge
         FROM forest_auth_challenges
        WHERE id = $1 AND wallet = $2 AND username = $3
          AND expires_at > now() AND used_at IS NULL
        FOR UPDATE`,
      [challengeId, wallet, username],
    );
    const challenge = challengeResult.rows[0];
    if (!challenge) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'challenge_expired_or_used' }, { status: 401 });
    }

    const validSignature = await verifyForestWalletSignature(wallet, challenge.challenge, signature);
    if (!validSignature) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'invalid_wallet_signature' }, { status: 401 });
    }

    await client.query('UPDATE forest_auth_challenges SET used_at = now() WHERE id = $1', [challengeId]);
    const inserted = await client.query(
      `INSERT INTO forest_players (wallet, username)
       VALUES ($1, $2)
       RETURNING wallet, username, created_at`,
      [wallet, username],
    );
    await client.query('COMMIT');
    return NextResponse.json({ profile: inserted.rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error?.code === '23505' && ['forest_players_username_ci', 'forest_players_username_key'].includes(error.constraint)) {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 });
    }
    if (error?.code === '23505' && error.constraint === 'forest_players_pkey') {
      return NextResponse.json({ error: 'profile_already_exists' }, { status: 409 });
    }
    console.error('Forest profile could not be registered', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  } finally {
    client.release();
  }
}
