/**
 * x402 Discovery Route (Standard Location)
 * 
 * Redirects to the API x402 endpoint for payment discovery
 * Standard: https://x402.org
 */

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

export const runtime = 'edge';

export async function GET() {
  // Redirect to the actual x402 API endpoint
  return NextResponse.redirect(`${BASE_URL}/api/.well-known/x402`, {
    status: 307, // Temporary redirect to allow caching
  });
}
