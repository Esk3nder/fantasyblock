import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-wrapper';
import { getSportsApiService } from '@/lib/services/sports-api';
import { ApiError } from '@/lib/api-errors';

interface RouteParams {
  params: { id: string };
}

export const GET = withApiHandler(async (request: NextRequest, { params }: RouteParams) => {
  const playerId = parseInt(params.id);
  
  if (isNaN(playerId)) {
    throw new ApiError('Invalid player ID', 400);
  }

  const sportsApi = getSportsApiService();
  const player = await sportsApi.getPlayerById(playerId);

  if (!player) {
    throw new ApiError('Player not found', 404);
  }

  return NextResponse.json({ player });
}, { requireAuth: false });