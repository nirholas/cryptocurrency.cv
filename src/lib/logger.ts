/**
 * Structured Logging System
 * 
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output
 * - Request context tracking
 * - Performance timing
 */

import { NextRequest } from 'next/server';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  meta?: Record<string, unknown>;
}

/**
 * Format log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Logger class
 */
class Logger {
  private context: LogContext = {};

  /**
   * Set context for subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get context from NextRequest
   */
  setRequestContext(request: NextRequest): void {
    this.setContext({
      requestId: request.headers.get('x-request-id') || undefined,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        context: this.context,
        meta,
      };
      console.debug(formatLogEntry(entry));
    }
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };
    console.log(formatLogEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };
    console.warn(formatLogEntry(entry));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      meta,
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      } else {
        entry.error = {
          message: String(error),
        };
      }
    }

    console.error(formatLogEntry(entry));
  }

  /**
   * Log request with timing
   */
  request(
    method: string,
    path: string,
    status: number,
    duration: number,
    meta?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level: status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO,
      message: `${method} ${path} ${status}`,
      timestamp: new Date().toISOString(),
      context: this.context,
      duration,
      meta: {
        ...meta,
        method,
        path,
        status,
      },
    };
    console.log(formatLogEntry(entry));
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Export singleton logger
export const logger = new Logger();

/**
 * Create logger for specific request
 */
export function createRequestLogger(request: NextRequest): Logger {
  const requestLogger = new Logger();
  requestLogger.setRequestContext(request);
  return requestLogger;
}

/**
 * Measure execution time
 */
export function measureTime<T>(
  fn: () => T | Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  const execute = async () => {
    const result = await fn();
    const duration = Date.now() - start;
    
    logger.debug(`${label} completed`, { duration });
    
    return { result, duration };
  };

  return execute();
}

// Legacy compatibility export
export function createLogger(module: string) {
  return {
    debug(message: string, data?: unknown): void {
      logger.debug(`[${module}] ${message}`, data as Record<string, unknown>);
    },
    info(message: string, data?: unknown): void {
      logger.info(`[${module}] ${message}`, data as Record<string, unknown>);
    },
    warn(message: string, data?: unknown): void {
      logger.warn(`[${module}] ${message}`, data as Record<string, unknown>);
    },
    error(message: string, data?: unknown): void {
      logger.error(`[${module}] ${message}`, data instanceof Error ? data : undefined, typeof data === 'object' ? data as Record<string, unknown> : undefined);
    },
  };
}

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
