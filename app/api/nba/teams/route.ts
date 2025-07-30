import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-wrapper';
import { getSportsApiService } from '@/lib/services/sports-api';

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || undefined;
  const conference = searchParams.get('conference') || undefined;

  const sportsApi = getSportsApiService();
  const teams = await sportsApi.getTeams({ division, conference });

  return NextResponse.json({ teams });
}, { requireAuth: false });