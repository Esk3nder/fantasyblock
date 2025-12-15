import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/health - Health check endpoint for load balancers and monitoring
 *
 * Returns:
 * - 200 OK if healthy
 * - 503 Service Unavailable if database is unreachable
 */
export async function GET() {
  const startTime = Date.now();

  const health: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
      database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks: {
      database: { status: 'ok' },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error: any) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'error',
      error: error.message || 'Database connection failed',
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
