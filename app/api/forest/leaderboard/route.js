import { NextResponse } from 'next/server';
import { getForestLeaderboard } from '../../../lib/forestLeaderboard';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  const period = new URL(request.url).searchParams.get('period') === 'all' ? 'all' : 'weekly';
  try {
    const result = await getForestLeaderboard(period);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Forest leaderboard unavailable', error);
    return NextResponse.json({ status: 'unavailable', rows: [], season: null }, { status: 503 });
  }
}
