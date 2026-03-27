/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * POST /api/auth/logout — Clear session cookies
 */

import { type NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  await clearSession(response);
  return response;
}
