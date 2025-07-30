import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-wrapper';
import { getSportsApiService } from '@/lib/services/sports-api';

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const playerIds = searchParams.get('player_ids')?.split(',').map(id => parseInt(id)) || undefined;
  const gameIds = searchParams.get('game_ids')?.split(',').map(id => parseInt(id)) || undefined;
  const seasons = searchParams.get('seasons')?.split(',').map(s => parseInt(s)) || undefined;
  const cursor = searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : undefined;
  const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined;

  const sportsApi = getSportsApiService();
  const result = await sportsApi.getPlayerStats({
    player_ids: playerIds,
    game_ids: gameIds,
    seasons,
    cursor,
    per_page: perPage,
  });

  return NextResponse.json(result);
}, { requireAuth: false });