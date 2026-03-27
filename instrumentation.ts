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
 * Next.js Instrumentation — bootstrap providers and telemetry at server startup
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server (not in edge runtime or during build)
  if (typeof window !== 'undefined') return;

  // Initialize OpenTelemetry SDK (traces + metrics export)
  const { initTelemetry } = await import('@/lib/telemetry');
  await initTelemetry();

  // Import setup to register all provider chains into the global registry
  // This runs once when the server starts, not on every request
  await import('@/lib/providers/setup');

  if (process.env.NODE_ENV !== 'production') {
    console.log('[instrumentation] OTel initialized, provider chains registered');
  }
}
