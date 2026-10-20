import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_MULTIVERSX_API_URL || 'https://api.multiversx.com';
const ADDRESS_PATTERN = /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/i;

async function getJson(path, revalidate = 30) {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`MultiversX API returned ${response.status}`);
  return response.json();
}

async function pace() {
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export async function GET(request) {
  const address = new URL(request.url).searchParams.get('address') || '';
  if (!ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: 'Invalid MultiversX wallet address.' }, { status: 400 });
  }

  try {
    const account = await getJson(`/accounts/${encodeURIComponent(address)}`);
    await pace();
    const tokens = await getJson(`/accounts/${encodeURIComponent(address)}/tokens?size=100`);
    await pace();
    const transactions = await getJson(`/transactions?address=${encodeURIComponent(address)}&size=10&status=success`);
    await pace();
    const economics = await getJson('/economics', 60);

    return NextResponse.json({
      address,
      balance: account.balance,
      egldPriceUsd: Number.isFinite(Number(economics.price)) ? Number(economics.price) : null,
      tokens: Array.isArray(tokens) ? tokens : [],
      transactions: Array.isArray(transactions) ? transactions : [],
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Wallet data is temporarily unavailable.' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
