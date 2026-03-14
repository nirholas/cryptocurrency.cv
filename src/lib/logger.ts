/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Structured Logging System (Pino)
 *
 * Canonical logging module for the entire application.
 * - Structured JSON in production (Vercel / Docker log aggregation)
 * - Pretty-printed human-readable output in development (pino-pretty)
 * - Automatic redaction of sensitive fields
 * - Domain-specific child loggers
 * - Backward-compatible helpers for existing callers
 */

import pino from "pino";
import { type NextRequest } from "next/server";

// =============================================================================
// CONFIGURATION
// =============================================================================

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // Structured JSON in production, pretty-printed in development
  transport: isProduction
    ? undefined // JSON to stdout (Vercel/Docker picks this up)
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },

  // Redact sensitive fields
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "apiKey",
      "password",
      "token",
      "secret",
      "DATABASE_URL",
      "REDIS_URL",
    ],
    censor: "[REDACTED]",
  },

  // Base fields on every log line
  base: {
    service: "free-crypto-news",
    env: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version,
  },

  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

// =============================================================================
// CHILD LOGGERS — domain-specific
// =============================================================================

export const apiLogger = logger.child({ module: "api" });
export const cacheLogger = logger.child({ module: "cache" });
export const dbLogger = logger.child({ module: "database" });
export const wsLogger = logger.child({ module: "websocket" });
export const authLogger = logger.child({ module: "auth" });
export const rateLimitLogger = logger.child({ module: "rate-limit" });
export const aiLogger = logger.child({ module: "ai" });
export const archiveLogger = logger.child({ module: "archive" });

// =============================================================================
// BACKWARD-COMPATIBLE HELPERS
// =============================================================================

/** Legacy LogLevel enum — kept for existing imports */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Create a request-scoped logger (backward-compatible wrapper).
 *
 * Returns an object with the same method signatures the old Logger class had,
 * so existing route handlers continue to work without changes.
 */
export function createRequestLogger(request: NextRequest) {
  const child = apiLogger.child({
    requestId: request.headers.get("x-request-id") || undefined,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      child.debug(meta ?? {}, message);
    },
    info(message: string, meta?: Record<string, unknown>) {
      child.info(meta ?? {}, message);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      child.warn(meta ?? {}, message);
    },
    error(
      message: string,
      error?: Error | unknown,
      meta?: Record<string, unknown>,
    ) {
      child.error(
        {
          ...(meta ?? {}),
          err: error instanceof Error ? error : error != null ? new Error(String(error)) : undefined,
        },
        message,
      );
    },
    request(
      method: string,
      path: string,
      status: number,
      duration: number,
      meta?: Record<string, unknown>,
    ) {
      const lvl = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
      child[lvl]({ method, path, status, duration, ...(meta ?? {}) }, `${method} ${path} ${status}`);
    },
    /** Expose the underlying Pino child for native API usage */
    pino: child,
  };
}

/**
 * Legacy createLogger(module) — returns an adapter with the old interface.
 */
export function createLogger(module: string) {
  const child = logger.child({ module });

  return {
    debug(message: string, data?: unknown) {
      child.debug(typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {}, `[${module}] ${message}`);
    },
    info(message: string, data?: unknown) {
      child.info(typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {}, `[${module}] ${message}`);
    },
    warn(message: string, data?: unknown) {
      child.warn(typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {}, `[${module}] ${message}`);
    },
    error(message: string, data?: unknown) {
      child.error(
        {
          err: data instanceof Error ? data : undefined,
          ...(typeof data === "object" && data !== null && !(data instanceof Error)
            ? (data as Record<string, unknown>)
            : {}),
        },
        `[${module}] ${message}`,
      );
    },
  };
}

/**
 * Measure execution time
 */
export function measureTime<T>(
  fn: () => T | Promise<T>,
  label: string,
): Promise<{ result: T; duration: number }> {
  const start = Date.now();

  const execute = async () => {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug({ duration }, `${label} completed`);
    return { result, duration };
  };

  return execute();
}

/**
 * Pre-configured loggers for common modules (legacy)
 */
export const loggers = {
  api: createLogger("API"),
  auth: createLogger("Auth"),
  ws: createLogger("WebSocket"),
  cache: createLogger("Cache"),
  pwa: createLogger("PWA"),
  admin: createLogger("Admin"),
} as const;
