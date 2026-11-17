import { NextResponse } from 'next/server';
import { getForestPool } from '../../../lib/forestDb';
import { getForestProgress, heartbeatForest, importForestLocalProgress, saveForestRun } from '../../../lib/forestGameService.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function respond(result) {
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request) {
  try {
    return respond(await getForestProgress(
      getForestPool(),
      new URL(request.url).searchParams.get('wallet'),
    ));
  } catch (error) {
    console.error('Forest progress could not be loaded', error);
    return respond({ status: 503, body: { error: 'progress_service_unavailable' } });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return respond({ status: 400, body: { error: 'invalid_request' } });
  }
  try {
    const pool = getForestPool();
    if (body?.action === 'heartbeat') return respond(await heartbeatForest(pool, body));
    if (body?.action === 'import') return respond(await importForestLocalProgress(pool, body));
    if (body?.action === 'run') return respond(await saveForestRun(pool, body));
    return respond({ status: 400, body: { error: 'unknown_action' } });
  } catch (error) {
    console.error('Forest progress could not be saved', error);
    return respond({ status: 503, body: { error: 'progress_service_unavailable' } });
  }
}
