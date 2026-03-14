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
 * GET /api/billing/usage
 *
 * Returns basic usage info for an API key.
 * Replaces the old Stripe-based usage endpoint.
 */
import { type NextRequest, NextResponse } from "next/server";
import { getKeyById, isKvConfigured } from "@/lib/api-keys";

// force-dynamic: reads x-api-key header for user-specific data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  if (!isKvConfigured()) {
    return NextResponse.json(
      { note: "KV not configured. Usage tracking unavailable.", apiKey: null },
      { status: 200 }
    );
  }

  const keyData = await getKeyById(apiKey).catch(() => null);
  if (!keyData) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  return NextResponse.json({
    keyId: keyData.id,
    tier: keyData.tier ?? "free",
    usageToday: keyData.usageToday ?? 0,
    rateLimit: keyData.rateLimit ?? 100,
    payment: {
      scheme: "x402",
      note: "Premium endpoints require per-request USDC payment on Base.",
    },
  });
}
