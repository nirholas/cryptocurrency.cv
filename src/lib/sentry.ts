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
 * Sentry Error Monitoring Configuration
 * 
 * This module provides error monitoring and performance tracking via Sentry.
 * It's designed to work with Next.js App Router and Edge Runtime.
 * 
 * Features:
 * - Automatic error capture
 * - Performance monitoring
 * - User context tracking
 * - Custom breadcrumbs
 * - Release tracking
 * 
 * Configuration:
 * Set SENTRY_DSN and SENTRY_AUTH_TOKEN in environment variables.
 * 
 * @module sentry
 */

// Note: This file provides a lightweight wrapper for Sentry.
// For full Sentry integration in Next.js, run: npx @sentry/wizard@latest -i nextjs

import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}

export interface SentryContext {
  [key: string]: unknown;
}

export interface SentryBreadcrumb {
  type?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'local';
const SAMPLE_RATE = parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0');
const TRACES_SAMPLE_RATE = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');

const isEnabled = !!SENTRY_DSN && process.env.NODE_ENV === 'production';

// =============================================================================
// EDGE-COMPATIBLE SENTRY WRAPPER
// =============================================================================

/**
 * Edge-compatible error reporting
 * 
 * In Edge Runtime, we can't use the full Sentry SDK, so we use the
 * Sentry envelope API directly or queue errors for server-side processing.
 */
/** Parsed DSN components for the Sentry envelope endpoint. */
interface ParsedDSN {
  host: string;
  projectId: string;
  publicKey: string;
}

function parseDSN(dsn: string): ParsedDSN | null {
  try {
    // DSN format: https://<publicKey>@<host>/<projectId>
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//,  '');
    const host = url.host;
    if (!publicKey || !projectId || !host) return null;
    return { host, projectId, publicKey };
  } catch {
    return null;
  }
}

class SentryEdge {
  private dsn: string | null;
  private parsed: ParsedDSN | null;
  private enabled: boolean;
  private breadcrumbs: SentryBreadcrumb[] = [];
  private user: SentryUser | null = null;
  private tags: Record<string, string> = {};
  private context: Record<string, SentryContext> = {};
  /** Queue of failed sends to retry (max 20). */
  private sendQueue: Array<Record<string, unknown>> = [];

  constructor() {
    this.dsn = SENTRY_DSN || null;
    this.parsed = this.dsn ? parseDSN(this.dsn) : null;
    this.enabled = isEnabled;
  }

  /**
   * Capture an exception
   */
  captureException(error: Error | unknown, context?: SentryContext): string | null {
    if (!this.enabled || !this.dsn) {
      console.error('[Sentry] Would capture:', error);
      return null;
    }

    const eventId = this.generateEventId();
    const err = error instanceof Error ? error : new Error(String(error));

    const event: Record<string, unknown> = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      server_name: 'edge',
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      exception: {
        values: [{
          type: err.name,
          value: err.message,
          stacktrace: err.stack ? { frames: this.parseStackFrames(err.stack) } : undefined,
        }],
      },
      tags: { ...this.tags },
      contexts: { ...this.context, ...(context ? { extra: context } : {}) },
      breadcrumbs: { values: this.breadcrumbs.slice(-20) },
      ...(this.user ? { user: this.user } : {}),
      sdk: { name: 'sentry.edge.custom', version: '1.0.0' },
    };

    // Fire-and-forget: send to Sentry via the Envelope API
    this.sendEnvelope(event);

    return eventId;
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: SentryBreadcrumb['level'] = 'info'): string | null {
    if (!this.enabled || !this.dsn) {
      logger.debug(`[Sentry] Would capture message (${level}): ${message}`);
      return null;
    }

    const eventId = this.generateEventId();

    const event: Record<string, unknown> = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level,
      server_name: 'edge',
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      message: { formatted: message },
      tags: { ...this.tags },
      contexts: { ...this.context },
      breadcrumbs: { values: this.breadcrumbs.slice(-20) },
      ...(this.user ? { user: this.user } : {}),
      sdk: { name: 'sentry.edge.custom', version: '1.0.0' },
    };

    this.sendEnvelope(event);

    return eventId;
  }

  /**
   * Set user context
   */
  setUser(user: SentryUser | null): void {
    this.user = user;
  }

  /**
   * Set a tag
   */
  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  /**
   * Set multiple tags
   */
  setTags(tags: Record<string, string>): void {
    Object.assign(this.tags, tags);
  }

  /**
   * Set extra context
   */
  setContext(name: string, context: SentryContext): void {
    this.context[name] = context;
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now() / 1000,
    });

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100);
    }
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string): SentryTransaction {
    return new SentryTransaction(name, op, this.enabled);
  }

  /**
   * Wrap a function with error tracking
   */
  withScope<T>(callback: (scope: SentryScope) => T): T {
    const scope = new SentryScope(this);
    return callback(scope);
  }

  /**
   * Check if Sentry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get configuration info
   */
  getConfig(): { enabled: boolean; environment: string; release: string } {
    return {
      enabled: this.enabled,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
    };
  }

  // ---------------------------------------------------------------------------
  // Sentry Envelope Transport
  // ---------------------------------------------------------------------------

  /**
   * Send a Sentry event via the Envelope API (edge-compatible, uses fetch).
   * https://develop.sentry.dev/sdk/envelopes/
   */
  private async sendEnvelope(event: Record<string, unknown>): Promise<void> {
    if (!this.parsed) return;
    const { host, projectId, publicKey } = this.parsed;
    const url = `https://${host}/api/${projectId}/envelope/`;

    // Envelope: header line, item header line, item payload
    const envelopeHeader = JSON.stringify({
      event_id: event.event_id,
      sent_at: new Date().toISOString(),
      dsn: this.dsn,
      sdk: event.sdk,
    });
    const itemHeader = JSON.stringify({
      type: 'event',
      content_type: 'application/json',
    });
    const itemPayload = JSON.stringify(event);
    const body = `${envelopeHeader}\n${itemHeader}\n${itemPayload}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=edge-custom/1.0, sentry_key=${publicKey}`,
        },
        body,
      });
      if (!res.ok) {
        // Queue for retry (up to 20)
        if (this.sendQueue.length < 20) {
          this.sendQueue.push(event);
        }
        console.warn(`[Sentry] Envelope send failed: ${res.status}`);
      } else {
        // Flush queued events on successful connection
        this.flushQueue();
      }
    } catch (err) {
      if (this.sendQueue.length < 20) {
        this.sendQueue.push(event);
      }
      console.warn('[Sentry] Envelope send error:', err);
    }
  }

  /** Best-effort flush of queued events. */
  private async flushQueue(): Promise<void> {
    if (this.sendQueue.length === 0 || !this.parsed) return;
    const items = this.sendQueue.splice(0, this.sendQueue.length);
    for (const event of items) {
      // Re-queue will be skipped on this pass since we already cleared
      await this.sendEnvelope(event).catch(() => {});
    }
  }

  /** Parse a JS Error stack into Sentry-compatible frames. */
  private parseStackFrames(stack: string): Array<{ filename: string; function: string; lineno?: number; colno?: number; in_app: boolean }> {
    const frames: Array<{ filename: string; function: string; lineno?: number; colno?: number; in_app: boolean }> = [];
    const lines = stack.split('\n').slice(1); // Skip the first "Error: message" line
    for (const line of lines) {
      const match = line.match(/^\s+at\s+(?:(.+?)\s+)?\(?(.*?):(\d+):(\d+)\)?$/);
      if (match) {
        frames.push({
          function: match[1] || '<anonymous>',
          filename: match[2],
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
          in_app: !match[2].includes('node_modules'),
        });
      }
    }
    // Sentry expects frames in reverse order (most recent last)
    return frames.reverse();
  }

  private generateEventId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}

// =============================================================================
// TRANSACTION & SCOPE CLASSES
// =============================================================================

class SentryTransaction {
  private name: string;
  private op: string;
  private startTime: number;
  private enabled: boolean;
  private spans: { name: string; startTime: number; endTime?: number }[] = [];

  constructor(name: string, op: string, enabled: boolean) {
    this.name = name;
    this.op = op;
    this.startTime = Date.now();
    this.enabled = enabled;
  }

  startChild(name: string): { finish: () => void } {
    const span = { name, startTime: Date.now(), endTime: 0 };
    this.spans.push(span);
    
    return {
      finish: () => {
        span.endTime = Date.now();
      },
    };
  }

  finish(): void {
    if (!this.enabled) return;

    const duration = Date.now() - this.startTime;
    logger.debug('[Sentry] Transaction finished', {
      name: this.name,
      op: this.op,
      duration,
      spanCount: this.spans.length,
    });
  }

  private _data: Record<string, unknown> = {};
  private _status: 'ok' | 'error' | 'cancelled' = 'ok';

  setData(key: string, value: unknown): void {
    this._data[key] = value;
  }

  setStatus(status: 'ok' | 'error' | 'cancelled'): void {
    this._status = status;
  }
}

class SentryScope {
  private sentry: SentryEdge;
  private scopeTags: Record<string, string> = {};
  private scopeContext: Record<string, SentryContext> = {};
  private scopeUser: SentryUser | null = null;

  constructor(sentry: SentryEdge) {
    this.sentry = sentry;
  }

  setTag(key: string, value: string): void {
    this.scopeTags[key] = value;
    this.sentry.setTag(key, value);
  }

  setContext(name: string, context: SentryContext): void {
    this.scopeContext[name] = context;
    this.sentry.setContext(name, context);
  }

  setUser(user: SentryUser | null): void {
    this.scopeUser = user;
    this.sentry.setUser(user);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const sentry = new SentryEdge();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Capture an error with optional context
 */
export function captureException(error: Error | unknown, context?: SentryContext): string | null {
  return sentry.captureException(error, context);
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level?: SentryBreadcrumb['level']): string | null {
  return sentry.captureMessage(message, level);
}

/**
 * Set user for error context
 */
export function setUser(user: SentryUser | null): void {
  sentry.setUser(user);
}

/**
 * Set a tag
 */
export function setTag(key: string, value: string): void {
  sentry.setTag(key, value);
}

/**
 * Add a breadcrumb
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): SentryTransaction {
  return sentry.startTransaction(name, op);
}

/**
 * Wrap an async function with error tracking
 */
export async function withErrorTracking<T>(
  name: string,
  fn: () => Promise<T>,
  context?: SentryContext
): Promise<T> {
  const transaction = sentry.startTransaction(name, 'function');
  
  try {
    addBreadcrumb({
      category: 'function',
      message: `Starting ${name}`,
      level: 'info',
    });
    
    const result = await fn();
    
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('error');
    captureException(error, { ...context, function: name });
    throw error;
  } finally {
    transaction.finish();
  }
}

// =============================================================================
// NEXT.JS HELPERS
// =============================================================================

import type { NextRequest } from 'next/server';

/**
 * Add request context to Sentry
 */
export function setRequestContext(request: NextRequest): void {
  const url = new URL(request.url);
  
  sentry.setContext('request', {
    method: request.method,
    url: url.pathname,
    query: Object.fromEntries(url.searchParams),
  });

  sentry.addBreadcrumb({
    category: 'http',
    message: `${request.method} ${url.pathname}`,
    level: 'info',
    data: {
      method: request.method,
      url: url.pathname,
    },
  });

  // Set user from headers if available
  const userId = request.headers.get('x-user-id');
  if (userId) {
    sentry.setUser({ id: userId });
  }
}

/**
 * Create error response with Sentry tracking
 */
export function errorResponse(
  error: Error | unknown,
  status = 500,
  context?: SentryContext
): Response {
  const eventId = captureException(error, context);
  
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  
  return new Response(
    JSON.stringify({
      error: message,
      status,
      ...(eventId && { eventId }),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export default sentry;
