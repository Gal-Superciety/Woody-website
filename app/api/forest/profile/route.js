import { NextResponse } from 'next/server';
import { getForestPool } from '../../../lib/forestDb';
import { normalizeWallet } from '../../../lib/forestAuth.mjs';
import { registerForestProfile } from '../../../lib/forestProfileService.mjs';

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

  const result = await registerForestProfile(body, { pool: getForestPool });
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
