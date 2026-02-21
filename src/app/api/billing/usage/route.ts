/**
 * GET /api/billing/usage
 *
 * Returns basic usage info for an API key.
 * Replaces the old Stripe-based usage endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import { getKeyById, isKvConfigured } from "@/lib/api-keys";

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
