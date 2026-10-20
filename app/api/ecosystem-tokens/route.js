import { NextResponse } from 'next/server';
import { ECOSYSTEM_TOKENS, normalizeTokenMarket } from '../../lib/ecosystemTokens.mjs';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_MULTIVERSX_API_URL || 'https://api.multiversx.com';

export async function GET() {
  const tokens = [];

  // Keep requests under the public MultiversX API's per-IP request limit.
  for (const [index, token] of ECOSYSTEM_TOKENS.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 550));
    try {
      const response = await fetch(`${API_URL}/tokens/${encodeURIComponent(token.identifier)}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`MultiversX API returned ${response.status}`);
      tokens.push(normalizeTokenMarket(token, await response.json()));
    } catch {
      tokens.push(normalizeTokenMarket(token, null));
    }
  }

  return NextResponse.json({ tokens, updatedAt: new Date().toISOString() }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
