import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError } from './api-errors';
import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter?: number;
}

// In-memory store (works for single instance; use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, identifier: string): Promise<void> => {
    const now = Date.now();
    const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;

    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return;
    }

    if (current.count >= config.maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      logger.warn('Rate limit exceeded', {
        key,
        count: current.count,
        maxRequests: config.maxRequests,
        retryAfter
      });
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }

    current.count++;
    rateLimitStore.set(key, current);
  };
}

/**
 * Check rate limit and return result (non-throwing version)
 */
export function checkRateLimit(config: RateLimitConfig, identifier: string): RateLimitResult {
  const now = Date.now();
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (current.count >= config.maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { success: false, remaining: 0, retryAfter };
  }

  current.count++;
  rateLimitStore.set(key, current);
  return { success: true, remaining: config.maxRequests - current.count };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),
      }
    }
  );
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimit({
  windowMs: 60000,  // 1 minute
  maxRequests: 100,
  keyPrefix: 'api'
});

export const authRateLimit = createRateLimit({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'auth'
});

export const draftRateLimit = createRateLimit({
  windowMs: 3600000, // 1 hour
  maxRequests: 10,   // 10 drafts per hour
  keyPrefix: 'draft'
});

export const aiRateLimit = createRateLimit({
  windowMs: 60000,  // 1 minute
  maxRequests: 20,  // 20 AI requests per minute
  keyPrefix: 'ai'
});
