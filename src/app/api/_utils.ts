/**
 * Shared API Route Utilities
 * Common helpers used across multiple route handlers.
 */

import { NextResponse } from 'next/server';

/**
 * Returns the standard 503 response when the Groq AI service is not configured.
 * Use this to replace the repeated if (!isGroqConfigured()) ... block in route handlers.
 */
export function groqNotConfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'AI features not configured',
      message:
        'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
    },
    { status: 503 }
  );
}
