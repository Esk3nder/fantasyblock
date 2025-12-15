import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { logger, generateRequestId, formatError } from '@/lib/logger';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/players - Search and filter players
 *
 * Query params:
 * - sport: NBA, NFL, MLB (default: NBA)
 * - search: Search by player name
 * - position: Filter by position (PG, SG, SF, PF, C, G, F)
 * - team: Filter by team abbreviation
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - sortBy: adp, fullName, team, position (default: adp)
 * - sortOrder: asc, desc (default: asc for adp, asc for fullName)
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

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const sport = (searchParams.get('sport')?.toUpperCase() || 'NBA') as 'NBA' | 'NFL' | 'MLB';
    const search = searchParams.get('search')?.trim();
    const position = searchParams.get('position')?.toUpperCase();
    const team = searchParams.get('team')?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const sortBy = searchParams.get('sortBy') || 'adp';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const offset = (page - 1) * limit;

    log.info('Fetching players', { sport, search, position, team, page, limit });

    // Build conditions
    const conditions = [eq(players.sport, sport)];

    if (search) {
      conditions.push(ilike(players.fullName, `%${search}%`));
    }

    if (position) {
      // Check both position and positions array
      conditions.push(
        or(
          eq(players.position, position),
          sql`${players.positions}::jsonb ? ${position}`
        )!
      );
    }

    if (team) {
      conditions.push(eq(players.team, team));
    }

    // Build sort
    let orderByClause;
    const direction = sortOrder === 'desc' ? desc : asc;

    switch (sortBy) {
      case 'fullName':
        orderByClause = direction(players.fullName);
        break;
      case 'team':
        orderByClause = direction(players.team);
        break;
      case 'position':
        orderByClause = direction(players.position);
        break;
      case 'adp':
      default:
        // For ADP, nulls should be last
        orderByClause = sql`${players.adp} ${sortOrder === 'desc' ? sql`DESC` : sql`ASC`} NULLS LAST`;
        break;
    }

    // Execute query
    const playerResults = await db
      .select()
      .from(players)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(and(...conditions));

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      players: playerResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    log.error('Error fetching players', formatError(error));
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
