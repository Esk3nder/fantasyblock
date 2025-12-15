import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drafts, draftPicks } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { logger, generateRequestId, formatError } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for updating a draft
const updateDraftSchema = z.object({
  leagueName: z.string().max(100).optional(),
  numTeams: z.number().int().min(4).max(20).optional(),
  draftPosition: z.number().int().min(1).max(20).optional(),
  scoringType: z.enum(['standard', 'ppr', 'half_ppr', 'points', 'categories']).optional(),
  rosterSize: z.number().int().min(5).max(25).optional(),
  status: z.enum(['setup', 'in_progress', 'completed', 'abandoned']).optional(),
  currentRound: z.number().int().min(1).optional(),
  currentPick: z.number().int().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/drafts/[id] - Get a specific draft
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

    log.info('Fetching draft', { draftId, userId });

    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    log.error('Error fetching draft', formatError(error));
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drafts/[id] - Update a draft
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check if draft exists and belongs to user
    const [existingDraft] = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDraftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Validate draft position if updating
    const numTeams = updateData.numTeams ?? existingDraft.numTeams;
    const draftPosition = updateData.draftPosition ?? existingDraft.draftPosition;
    if (draftPosition > numTeams) {
      return NextResponse.json(
        { error: 'Draft position cannot exceed number of teams' },
        { status: 400 }
      );
    }

    log.info('Updating draft', { draftId, userId, updates: Object.keys(updateData) });

    const [updatedDraft] = await db
      .update(drafts)
      .set(updateData)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)))
      .returning();

    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    log.error('Error updating draft', formatError(error));
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id] - Delete a draft
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

    log.info('Deleting draft', { draftId, userId });

    // Delete the draft (cascade will handle picks)
    const [deletedDraft] = await db
      .delete(drafts)
      .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)))
      .returning();

    if (!deletedDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    log.info('Draft deleted', { draftId, userId });

    return NextResponse.json({ success: true, deletedId: draftId });
  } catch (error) {
    log.error('Error deleting draft', formatError(error));
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
