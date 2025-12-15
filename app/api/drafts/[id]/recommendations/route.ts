import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drafts, draftPicks, players } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, notInArray } from 'drizzle-orm';
import { logger, generateRequestId, formatError } from '@/lib/logger';
import { aiRateLimit } from '@/lib/rate-limit';
import { checkAIAccess } from '@/lib/subscription';
import { generateRecommendations, type DraftContext } from '@/lib/draft-ai';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/drafts/[id]/recommendations - Get AI-powered draft recommendations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id: draftId } = await params;
  const log = {
    info: (msg: string, data?: Record<string, unknown>) => logger.info(msg, { ...data, requestId }),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(msg, { ...data, requestId }),
    warn: (msg: string, data?: Record<string, unknown>) => logger.warn(msg, { ...data, requestId }),
  };

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Validate UUID format
    if (!draftId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    // Check AI access (Pro plan only)
    const aiAccess = await checkAIAccess(userId);
    if (!aiAccess.allowed) {
      return NextResponse.json(
        {
          error: 'Upgrade required',
          message: aiAccess.reason,
          plan: aiAccess.plan.planName,
        },
        { status: 403 }
      );
    }

    // Rate limiting for AI requests
    try {
      await aiRateLimit(request, userId);
    } catch (rateLimitError: any) {
      log.warn('AI rate limit exceeded', { userId, draftId });
      return NextResponse.json(
        { error: rateLimitError.message },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitError.retryAfter || 60) }
        }
      );
    }

    // Verify draft ownership
    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    log.info('Generating draft recommendations', { draftId, userId });

    // Get all picks for this draft
    const picksWithPlayers = await db
      .select({
        pick: draftPicks,
        player: players,
      })
      .from(draftPicks)
      .leftJoin(players, eq(draftPicks.playerId, players.id))
      .where(eq(draftPicks.draftId, draftId));

    // Get drafted player IDs
    const draftedPlayerIds = picksWithPlayers.map(p => p.pick.playerId);

    // Get available players (not drafted)
    let availablePlayers;
    if (draftedPlayerIds.length > 0) {
      availablePlayers = await db
        .select()
        .from(players)
        .where(
          and(
            eq(players.sport, draft.sport),
            notInArray(players.id, draftedPlayerIds)
          )
        );
    } else {
      availablePlayers = await db
        .select()
        .from(players)
        .where(eq(players.sport, draft.sport));
    }

    // Get user's roster (their team's picks)
    const userRoster = picksWithPlayers
      .filter(p => p.pick.teamNumber === draft.draftPosition && p.player)
      .map(p => p.player!);

    // Build draft context
    const context: DraftContext = {
      draft,
      picks: picksWithPlayers.map(p => ({
        ...p.pick,
        player: p.player,
      })),
      availablePlayers,
      userRoster,
      currentPick: draft.currentPick || 1,
      userTeamNumber: draft.draftPosition,
    };

    // Generate recommendations
    const result = await generateRecommendations(context);

    log.info('Recommendations generated', {
      draftId,
      userId,
      recommendationCount: result.recommendations.length,
    });

    return NextResponse.json({
      ...result,
      draftContext: {
        currentPick: context.currentPick,
        userRosterSize: userRoster.length,
        availablePlayersCount: availablePlayers.length,
      },
    });
  } catch (error) {
    log.error('Error generating recommendations', formatError(error));
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
