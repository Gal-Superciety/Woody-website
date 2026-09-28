import { NextResponse } from 'next/server';
import { getForestPool } from '../../../lib/forestDb';
import { normalizeWallet, USERNAME_PATTERN } from '../../../lib/forestAuth.mjs';
import { verifyForestNativeAuth } from '../../../lib/forestNativeAuth.mjs';

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
  if (!wallet || !USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const authorization = request.headers.get('authorization') || '';
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!accessToken) return NextResponse.json({ error: 'invalid_native_auth' }, { status: 401 });

  let verifiedWallet;
  try {
    verifiedWallet = await verifyForestNativeAuth(accessToken);
  } catch (error) {
    console.error('Forest wallet login could not be validated', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  }
  if (!verifiedWallet || verifiedWallet !== wallet) {
    return NextResponse.json({ error: 'invalid_native_auth' }, { status: 401 });
  }

  try {
    const inserted = await getForestPool().query(
      `INSERT INTO forest_players (wallet, username)
       VALUES ($1, $2)
       RETURNING wallet, username, created_at`,
      [wallet, username],
    );
    return NextResponse.json({ profile: inserted.rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error?.code === '23505' && ['forest_players_username_ci', 'forest_players_username_key'].includes(error.constraint)) {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 });
    }
    if (error?.code === '23505' && error.constraint === 'forest_players_pkey') {
      return NextResponse.json({ error: 'profile_already_exists' }, { status: 409 });
    }
    console.error('Forest profile could not be registered', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  }
}
