import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MONITOR_URL = 'https://worker-production-3838.up.railway.app/status.json';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let upstream;
    try {
      upstream = await fetch(MONITOR_URL, { cache: 'no-store', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!upstream.ok) throw new Error('Monitor returned ' + upstream.status);
    const payload = await upstream.json();
    if (!payload || typeof payload !== 'object' || !payload.updatedAt) throw new Error('Monitor payload invalid');
    const age = Date.now() / 1000 - Number(payload.updatedAt);
    if (!Number.isFinite(age) || age > 300 || age < -60) {
      return NextResponse.json({ available: false, reason: 'stale' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ available: false, reason: 'monitor_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
