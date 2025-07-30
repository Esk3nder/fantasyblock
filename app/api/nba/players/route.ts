import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-wrapper';
import { getSportsApiService } from '@/lib/services/sports-api';

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const teamIds = searchParams.get('team_ids')?.split(',').map(id => parseInt(id)) || undefined;
  const firstName = searchParams.get('first_name') || undefined;
  const lastName = searchParams.get('last_name') || undefined;
  const cursor = searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : undefined;
  const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined;

  const sportsApi = getSportsApiService();
  const result = await sportsApi.getPlayers({
    search,
    team_ids: teamIds,
    first_name: firstName,
    last_name: lastName,
    cursor,
    per_page: perPage,
  });

  return NextResponse.json(result);
}, { requireAuth: false });