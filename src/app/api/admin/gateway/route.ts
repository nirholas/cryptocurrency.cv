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
 * API Gateway Management Routes
 *
 * Admin endpoints for managing API keys, viewing usage, and configuring webhooks.
 *
 * @route POST /api/admin/gateway — Create new API key
 * @route GET  /api/admin/gateway — List keys / get usage stats
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  createApiKey,
  getUsageStats,
  TIER_CONFIG,
  type ApiKeyCreateRequest,
  type ApiTier,
} from "@/lib/gateway";

export const runtime = "nodejs";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.CRON_SECRET;

/** Constant-time string comparison to prevent timing attacks. */
function secureCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  const maxLen = Math.max(bufA.byteLength, bufB.byteLength);
  if (maxLen === 0) return false;
  let result = bufA.byteLength ^ bufB.byteLength;
  for (let i = 0; i < maxLen; i++) {
    result |=
      (bufA[i % bufA.byteLength] ?? 0) ^ (bufB[i % bufB.byteLength] ?? 0);
  }
  return result === 0;
}

function isAuthorized(request: NextRequest): boolean {
  if (!ADMIN_TOKEN) return false;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  return secureCompare(auth, `Bearer ${ADMIN_TOKEN}`);
}

/**
 * POST /api/admin/gateway — Create a new API key
 * Body: { name, tier?, ownerId, ownerEmail?, allowedOrigins?, webhookUrl? }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ApiKeyCreateRequest;

    if (!body.name || !body.ownerId) {
      return NextResponse.json(
        { error: "Missing required fields: name, ownerId" },
        { status: 400 },
      );
    }

    // Validate tier
    const tier = (body.tier ?? "free") as ApiTier;
    if (!TIER_CONFIG[tier]) {
      return NextResponse.json(
        {
          error: `Invalid tier: ${tier}. Must be one of: ${Object.keys(TIER_CONFIG).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const result = await createApiKey({ ...body, tier });

    return NextResponse.json(
      {
        success: true,
        apiKey: result.key,
        keyId: result.record.id,
        tier: result.record.tier,
        limits: {
          requestsPerHour: result.record.rateLimit,
          requestsPerDay: result.record.dailyLimit,
          burstLimit: result.record.burstLimit,
        },
        message: "Store this API key securely — it cannot be retrieved again.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Admin Gateway] Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/gateway?keyId=...&days=7 — Get usage stats for a key
 * GET /api/admin/gateway?tiers — Get tier configuration
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;

  // Return tier configuration
  if (params.has("tiers")) {
    return NextResponse.json({
      tiers: Object.entries(TIER_CONFIG).map(([name, config]) => ({
        name,
        ...config,
      })),
    });
  }

  // Return usage stats for a specific key
  const keyId = params.get("keyId");
  if (keyId) {
    const days = parseInt(params.get("days") ?? "7", 10);
    const stats = await getUsageStats(keyId, days);
    return NextResponse.json({ keyId, ...stats });
  }

  return NextResponse.json({
    endpoints: {
      "POST /api/admin/gateway": "Create new API key",
      "GET /api/admin/gateway?tiers": "List tier configuration",
      "GET /api/admin/gateway?keyId=...&days=7": "Get usage stats",
    },
  });
}
