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
 * Request Logging Utilities
 *
 * Convenience helpers for logging API requests and errors
 * with consistent structure across all route handlers.
 */

import { apiLogger } from "@/lib/logger";
import { type NextRequest } from "next/server";

export function logApiRequest(
  req: NextRequest,
  extra?: Record<string, unknown>,
) {
  apiLogger.info(
    {
      method: req.method,
      url: req.nextUrl.pathname,
      search: req.nextUrl.search,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent")?.slice(0, 100),
      ...extra,
    },
    `${req.method} ${req.nextUrl.pathname}`,
  );
}

export function logApiError(
  req: NextRequest,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  apiLogger.error(
    {
      method: req.method,
      url: req.nextUrl.pathname,
      err: error instanceof Error ? error : new Error(String(error)),
      ...extra,
    },
    `Error: ${req.method} ${req.nextUrl.pathname}`,
  );
}
