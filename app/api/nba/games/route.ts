import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-wrapper';
import { getSportsApiService } from '@/lib/services/sports-api';

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const dates = searchParams.get('dates')?.split(',') || undefined;
  const seasons = searchParams.get('seasons')?.split(',').map(s => parseInt(s)) || undefined;
  const teamIds = searchParams.get('team_ids')?.split(',').map(id => parseInt(id)) || undefined;
  const postseason = searchParams.get('postseason') === 'true' || undefined;
  const cursor = searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : undefined;
  const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined;

  const sportsApi = getSportsApiService();
  const result = await sportsApi.getGames({
    dates,
    seasons,
    team_ids: teamIds,
    postseason,
    cursor,
    per_page: perPage,
  });

  return NextResponse.json(result);
}, { requireAuth: false });