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
  isTrustedOrigin: boolean;
  isAlibabaGateway: boolean;
  isApiClient: boolean;
  clientIp: string;
  apiKeyTier: 'free' | 'pro' | 'enterprise' | null;
  apiKeyId: string | null;
  headers: Record<string, string>;
}

export type MiddlewareHandler = (
  ctx: MiddlewareContext,
) => Promise<MiddlewareContext | NextResponse> | MiddlewareContext | NextResponse;
