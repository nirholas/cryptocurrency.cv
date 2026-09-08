/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  getLatestNews,
  searchNews,
  getDefiNews,
  getBitcoinNews,
  getBreakingNews,
  getSources,
} from "@/lib/crypto-news";

export const runtime = "edge";

const MAX_LIMIT = 100;
const MAX_KEYWORD_LENGTH = 500;

function clampLimit(val: unknown, fallback: number): number {
  const n = typeof val === "number" ? val : parseInt(String(val), 10);
  return Number.isFinite(n) ? Math.min(Math.max(1, n), MAX_LIMIT) : fallback;
}

function sanitizeString(val: unknown, maxLen: number): string {
  return typeof val === "string" ? val.slice(0, maxLen) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiName = typeof body?.apiName === "string" ? body.apiName : "";
    let args: Record<string, unknown> = {};
    if (typeof body?.arguments === "string") {
      try {
        args = JSON.parse(body.arguments);
      } catch {
        args = {};
      }
    } else if (body?.arguments && typeof body.arguments === "object") {
      args = body.arguments;
    }

    let result;
    switch (apiName) {
      case "getLatestNews":
        result = await getLatestNews(
          clampLimit(args.limit, 10),
          sanitizeString(args.source, 100) || undefined,
        );
        break;
      case "searchNews":
        result = await searchNews(
          sanitizeString(args.keywords, MAX_KEYWORD_LENGTH),
          clampLimit(args.limit, 10),
        );
        break;
      case "getDefiNews":
        result = await getDefiNews(clampLimit(args.limit, 10));
        break;
      case "getBitcoinNews":
        result = await getBitcoinNews(clampLimit(args.limit, 10));
        break;
      case "getBreakingNews":
        result = await getBreakingNews(clampLimit(args.limit, 5));
        break;
      case "getSources":
        result = await getSources();
        break;
      default:
        return NextResponse.json(
          { error: "Unknown API name" },
          { status: 400 },
        );
    }

    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gateway error" }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
