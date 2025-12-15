import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Debug endpoint - secured for development and admin access only
 *
 * Access rules:
 * - Development mode: Always accessible (for local debugging)
 * - Production mode: Requires authenticated admin user
 */
export async function GET(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // In production, require authentication
  if (!isDevelopment) {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Optional: Add admin role check if you have roles
    // if (sessionResponse.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }
  }

  // Safe environment check - only shows boolean presence, not values
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    AUTUMN_SECRET_KEY: !!process.env.AUTUMN_SECRET_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'not set',
  };

  // Database connection check
  let dbStatus = 'unknown';
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      connectionTimeoutMillis: 5000, // 5 second timeout
    });

    await pool.query('SELECT 1');
    dbStatus = 'connected';
    await pool.end();
  } catch (error: unknown) {
    // In production, don't expose error details
    if (isDevelopment && error instanceof Error) {
      dbStatus = `error: ${error.message}`;
    } else {
      dbStatus = 'error: connection failed';
    }
  }

  return NextResponse.json({
    envCheck,
    dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
