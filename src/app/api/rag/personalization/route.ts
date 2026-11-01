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
 * Personalization API — Phase 4.3
 *
 * POST /api/rag/personalization           — Update user preferences
 * GET  /api/rag/personalization?userId=X   — Get user profile / stats
 * DELETE /api/rag/personalization?userId=X — Delete user data (right to erasure)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getPersonalizationEngine } from '@/lib/rag/personalization';
import { UpdatePreferencesSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';

const engine = getPersonalizationEngine();

// ─── POST: Update Preferences ─────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'feedback');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    logRequest(request, 'personalization', body);

    const parsed = UpdatePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { userId, preferences } = parsed.data;
    const profile = engine.updatePreferences(userId, preferences);

    const response = NextResponse.json({
      success: true,
      userId: profile.userId,
      preferences: profile.preferences,
      inferredInterests: profile.inferredInterests.slice(0, 20),
    });

    return withRateLimitHeaders(response, request, 'feedback');
  } catch (error) {
    return handleAPIError(error, 'personalization');
  }
}

// ─── GET: User Stats / Export ─────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'metrics');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    logRequest(request, 'personalization-get');

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      // System stats
      const response = NextResponse.json({
        totalUsers: engine.totalUsers,
      });
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // ?export=true — full data export (GDPR portability)
    if (searchParams.get('export') === 'true') {
      const data = engine.exportUserData(userId);
      if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const response = NextResponse.json({ data });
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // ?privacy=<true|false> — toggle privacy mode
    const privacy = searchParams.get('privacy');
    if (privacy !== null) {
      engine.setPrivacyMode(userId, privacy === 'true');
      const stats = engine.getUserStats(userId);
      const response = NextResponse.json({
        success: true,
        privacyMode: stats?.privacyMode ?? false,
      });
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // Default: user stats
    const stats = engine.getUserStats(userId);
    if (!stats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const response = NextResponse.json(stats);
    return withRateLimitHeaders(response, request, 'metrics');
  } catch (error) {
    return handleAPIError(error, 'personalization-get');
  }
}

// ─── DELETE: Erase User Data ──────────────────────────────────

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'feedback');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    logRequest(request, 'personalization-delete');

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const deleted = engine.deleteUser(userId);
    const response = NextResponse.json({
      success: true,
      deleted,
      message: deleted ? 'All user data has been permanently removed' : 'User not found',
    });

    return withRateLimitHeaders(response, request, 'feedback');
  } catch (error) {
    return handleAPIError(error, 'personalization-delete');
  }
}
