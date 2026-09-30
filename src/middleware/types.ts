/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Middleware Types
 *
 * Shared types for the composable middleware pipeline.
 *
 * @module middleware/types
 */

import type { NextRequest, NextResponse } from 'next/server';

export interface MiddlewareContext {
  request: NextRequest;
  response?: NextResponse;
  requestId: string;
  startTime: number;
  pathname: string;
  isApiRoute: boolean;
  isEmbedRoute: boolean;
  isSperaxOS: boolean;
  speraxosKeyId: string | null;
  isTrustedOrigin: boolean;
  /**
   * Rate-limit bucket for a trusted request: `internal`, `first-party:<ip>` or
   * `partner:<host>`. Keeps one caller from spending another's allowance.
   */
  trustedBucket?: string;
  isApiClient: boolean;
  clientIp: string;
  apiKeyTier: 'free' | 'pro' | 'enterprise' | null;
  apiKeyId: string | null;
  headers: Record<string, string>;
}

export type MiddlewareHandler = (
  ctx: MiddlewareContext,
) => Promise<MiddlewareContext | NextResponse> | MiddlewareContext | NextResponse;
