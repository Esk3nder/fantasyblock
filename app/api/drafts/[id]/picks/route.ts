import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drafts, draftPicks, players } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { logger, generateRequestId, formatError } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for making a pick
const makePickSchema = z.object({
  playerId: z.string().uuid(),
  teamNumber: z.number().int().min(1).max(20),
  round: z.number().int().min(1),
  pickNumber: z.number().int().min(1),
  pickInRound: z.number().int().min(1),
  isUserPick: z.boolean().default(false),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/drafts/[id]/picks - Get all picks for a draft
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id: draftId } = await params;
  const log = {
    info: (msg: string, data?: Record<string, unknown>) => logger.info(msg, { ...data, requestId }),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(msg, { ...data, requestId }),
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

    // Verify draft ownership
    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    log.info('Fetching draft picks', { draftId, userId });

    // Get picks with player data
    const picks = await db
      .select({
        pick: draftPicks,
        player: players,
      })
      .from(draftPicks)
      .leftJoin(players, eq(draftPicks.playerId, players.id))
      .where(eq(draftPicks.draftId, draftId))
      .orderBy(draftPicks.pickNumber);

    // Format response
    const formattedPicks = picks.map(({ pick, player }) => ({
      ...pick,
      player: player ? {
        id: player.id,
        fullName: player.fullName,
        team: player.team,
        position: player.position,
        positions: player.positions,
      } : null,
    }));

    return NextResponse.json({ picks: formattedPicks });
  } catch (error) {
    log.error('Error fetching draft picks', formatError(error));
    return NextResponse.json(
      { error: 'Failed to fetch draft picks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts/[id]/picks - Make a pick
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id: draftId } = await params;
  const log = {
    info: (msg: string, data?: Record<string, unknown>) => logger.info(msg, { ...data, requestId }),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(msg, { ...data, requestId }),
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

    // Verify draft ownership and status
    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status === 'completed') {
      return NextResponse.json({ error: 'Draft is already completed' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = makePickSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const pickData = validationResult.data;

    // Verify player exists
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, pickData.playerId));

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Check if player is already drafted
    const [existingPick] = await db
      .select()
      .from(draftPicks)
      .where(and(eq(draftPicks.draftId, draftId), eq(draftPicks.playerId, pickData.playerId)));

    if (existingPick) {
      return NextResponse.json({ error: 'Player already drafted' }, { status: 400 });
    }

    log.info('Making draft pick', {
      draftId,
      userId,
      playerId: pickData.playerId,
      teamNumber: pickData.teamNumber,
      pickNumber: pickData.pickNumber,
    });

    // Create the pick
    const [newPick] = await db
      .insert(draftPicks)
      .values({
        draftId,
        playerId: pickData.playerId,
        teamNumber: pickData.teamNumber,
        round: pickData.round,
        pickNumber: pickData.pickNumber,
        pickInRound: pickData.pickInRound,
        isUserPick: pickData.isUserPick,
      })
      .returning();

    // Update draft state
    await db
      .update(drafts)
      .set({
        status: 'in_progress',
        currentRound: pickData.round,
        currentPick: pickData.pickNumber + 1,
      })
      .where(eq(drafts.id, draftId));

    // Check if draft is complete
    const totalPicks = draft.numTeams * draft.rosterSize;
    if (pickData.pickNumber >= totalPicks) {
      await db
        .update(drafts)
        .set({ status: 'completed' })
        .where(eq(drafts.id, draftId));
    }

    log.info('Draft pick made', { pickId: newPick.id, draftId });

    return NextResponse.json({
      pick: {
        ...newPick,
        player: {
          id: player.id,
          fullName: player.fullName,
          team: player.team,
          position: player.position,
        },
      },
    }, { status: 201 });
  } catch (error) {
    log.error('Error making draft pick', formatError(error));
    return NextResponse.json(
      { error: 'Failed to make draft pick' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id]/picks - Undo the last pick (if it's the user's pick)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id: draftId } = await params;
  const log = {
    info: (msg: string, data?: Record<string, unknown>) => logger.info(msg, { ...data, requestId }),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(msg, { ...data, requestId }),
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

    // Verify draft ownership
    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get the last pick
    const [lastPick] = await db
      .select()
      .from(draftPicks)
      .where(eq(draftPicks.draftId, draftId))
      .orderBy(desc(draftPicks.pickNumber))
      .limit(1);

    if (!lastPick) {
      return NextResponse.json({ error: 'No picks to undo' }, { status: 400 });
    }

    // Only allow undoing user's own picks
    if (!lastPick.isUserPick) {
      return NextResponse.json({ error: 'Can only undo your own picks' }, { status: 403 });
    }

    log.info('Undoing draft pick', { pickId: lastPick.id, draftId, userId });

    // Delete the pick
    await db
      .delete(draftPicks)
      .where(eq(draftPicks.id, lastPick.id));

    // Update draft state
    await db
      .update(drafts)
      .set({
        status: lastPick.pickNumber === 1 ? 'setup' : 'in_progress',
        currentRound: lastPick.round,
        currentPick: lastPick.pickNumber,
      })
      .where(eq(drafts.id, draftId));

    log.info('Draft pick undone', { pickId: lastPick.id, draftId });

    return NextResponse.json({ success: true, undonePickId: lastPick.id });
  } catch (error) {
    log.error('Error undoing draft pick', formatError(error));
    return NextResponse.json(
      { error: 'Failed to undo draft pick' },
      { status: 500 }
    );
  }
}
