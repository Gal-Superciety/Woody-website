import { randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getForestPool } from '../../../../lib/forestDb';
import { normalizeWallet, USERNAME_PATTERN } from '../../../../lib/forestAuth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ error: 'invalid_wallet_or_username' }, { status: 400 });
  }

  const challengeId = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
  const nonce = randomBytes(32).toString('base64url');
  const challenge = [
    'WOODY Forest Adventure player profile',
    `Wallet: ${wallet}`,
    `Username: ${username}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`,
    'Sign this message to bind this username to your wallet. This does not authorize transactions.',
  ].join('\n');

  try {
    const pool = getForestPool();
    await pool.query(
      `INSERT INTO forest_auth_challenges (id, wallet, username, challenge, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [challengeId, wallet, username, challenge, expiresAt],
    );
    return NextResponse.json({ challengeId, challenge, expiresAt }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Forest profile challenge could not be created', error);
    return NextResponse.json({ error: 'profile_service_unavailable' }, { status: 503 });
  }
}
