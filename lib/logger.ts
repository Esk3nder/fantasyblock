/**
 * Structured Logger for FantasyBlock
 *
 * Outputs JSON-formatted logs for production observability.
 * Can be upgraded to pino/winston later for advanced features.
 *
 * Usage:
 *   import { logger, createRequestLogger } from '@/lib/logger';
 *
 *   // Basic logging
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Database error', { error: err.message });
 *
 *   // Request-scoped logging (with requestId)
 *   const log = createRequestLogger(requestId);
 *   log.info('Processing request', { path: '/api/drafts' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Only show logs at or above this level
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
];

/**
 * Redacts sensitive fields from log data
 */
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, data: Record<string, unknown> = {}, requestId?: string): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
    ...redactSensitiveData(data),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Main logger instance
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
};

/**
 * Creates a request-scoped logger with automatic requestId inclusion
 */
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data, requestId),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data, requestId),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data, requestId),
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data, requestId),
  };
}

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extracts error details for logging
 */
export function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
  return { error: String(error) };
}
