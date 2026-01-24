/**
 * Centralized Logger Utility
 *
 * Provides consistent logging across the application with:
 * - Environment-aware output (suppresses debug in production)
 * - Structured log format for better debugging
 * - Named loggers for different modules
 *
 * @module lib/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

// ============================================================================
// Configuration
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDebugEnabled = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

/**
 * Minimum log level based on environment
 * Production: info and above
 * Development: debug and above (all)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel = isProduction && !isDebugEnabled ? 'info' : 'debug';

// ============================================================================
// Logger Implementation
// ============================================================================

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatMessage(entry: LogEntry): string {
  const prefix = `[${entry.module}]`;
  return `${prefix} ${entry.message}`;
}

function logToConsole(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const message = formatMessage(entry);

  switch (entry.level) {
    case 'debug':
      if (entry.data !== undefined) {
        console.debug(message, entry.data);
      } else {
        console.debug(message);
      }
      break;
    case 'info':
      if (entry.data !== undefined) {
        console.info(message, entry.data);
      } else {
        console.info(message);
      }
      break;
    case 'warn':
      if (entry.data !== undefined) {
        console.warn(message, entry.data);
      } else {
        console.warn(message);
      }
      break;
    case 'error':
      if (entry.data !== undefined) {
        console.error(message, entry.data);
      } else {
        console.error(message);
      }
      break;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a logger for a specific module
 *
 * @example
 * const log = createLogger('WebSocket');
 * log.info('Connection established');
 * log.debug('Received message', { type: 'price' });
 * log.error('Connection failed', error);
 */
export function createLogger(module: string) {
  return {
    debug(message: string, data?: unknown): void {
      logToConsole({
        level: 'debug',
        module,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    },

    info(message: string, data?: unknown): void {
      logToConsole({
        level: 'info',
        module,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    },

    warn(message: string, data?: unknown): void {
      logToConsole({
        level: 'warn',
        module,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    },

    error(message: string, data?: unknown): void {
      logToConsole({
        level: 'error',
        module,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    },
  };
}

/**
 * Default application logger
 */
export const logger = createLogger('App');

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  api: createLogger('API'),
  auth: createLogger('Auth'),
  ws: createLogger('WebSocket'),
  cache: createLogger('Cache'),
  pwa: createLogger('PWA'),
  admin: createLogger('Admin'),
} as const;
