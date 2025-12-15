import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drafts } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { logger, generateRequestId, formatError } from '@/lib/logger';
import { draftRateLimit, getClientIP } from '@/lib/rate-limit';
import { checkDraftAccess, getSubscriptionStatus } from '@/lib/subscription';
import { z } from 'zod';

// Validation schema for creating a draft
const createDraftSchema = z.object({
  sport: z.enum(['NBA', 'NFL', 'MLB']).default('NBA'),
  draftType: z.enum(['snake', 'auction', 'linear']).default('snake'),
  leagueName: z.string().max(100).optional(),
  numTeams: z.number().int().min(4).max(20).default(12),
  draftPosition: z.number().int().min(1).max(20).default(1),
  scoringType: z.enum(['standard', 'ppr', 'half_ppr', 'points', 'categories']).default('points'),
  rosterSize: z.number().int().min(5).max(25).default(13),
  settings: z.record(z.unknown()).optional(),
});

/**
 * GET /api/drafts - List user's drafts
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
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
    log.info('Fetching drafts', { userId });

    const userDrafts = await db
      .select()
      .from(drafts)
      .where(eq(drafts.userId, userId))
      .orderBy(desc(drafts.createdAt));

    // Include subscription status in response
    const subscription = await getSubscriptionStatus(userId);

    return NextResponse.json({
      drafts: userDrafts,
      subscription,
    });
  } catch (error) {
    log.error('Error fetching drafts', formatError(error));
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts - Create a new draft
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
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

    // Rate limiting
    try {
      await draftRateLimit(request, userId);
    } catch (rateLimitError: any) {
      log.warn('Draft rate limit exceeded', { userId });
      return NextResponse.json(
        { error: rateLimitError.message },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitError.retryAfter || 3600) }
        }
      );
    }

    // Check subscription limits
    const accessCheck = await checkDraftAccess(userId);
    if (!accessCheck.allowed) {
      log.info('Draft creation blocked by subscription limit', {
        userId,
        draftsUsed: accessCheck.draftsUsedThisMonth,
        limit: accessCheck.draftsLimit,
        plan: accessCheck.plan.planId,
      });
      return NextResponse.json(
        {
          error: 'Subscription limit reached',
          message: accessCheck.reason,
          subscription: {
            plan: accessCheck.plan.planName,
            draftsUsed: accessCheck.draftsUsedThisMonth,
            draftsLimit: accessCheck.draftsLimit,
          },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDraftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const draftData = validationResult.data;

    // Validate draft position is within team count
    if (draftData.draftPosition > draftData.numTeams) {
      return NextResponse.json(
        { error: 'Draft position cannot exceed number of teams' },
        { status: 400 }
      );
    }

    log.info('Creating draft', { userId, sport: draftData.sport, draftType: draftData.draftType });

    // Create the draft
    const [newDraft] = await db
      .insert(drafts)
      .values({
        userId,
        sport: draftData.sport,
        draftType: draftData.draftType,
        leagueName: draftData.leagueName,
        numTeams: draftData.numTeams,
        draftPosition: draftData.draftPosition,
        scoringType: draftData.scoringType,
        rosterSize: draftData.rosterSize,
        settings: draftData.settings,
        status: 'setup',
      })
      .returning();

    log.info('Draft created', { draftId: newDraft.id, userId });

    return NextResponse.json({ draft: newDraft }, { status: 201 });
  } catch (error) {
    log.error('Error creating draft', formatError(error));
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
