/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { NextResponse } from 'next/server';
import { generatePumpAlerts } from '@/lib/pump-detection';

export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  const data = generatePumpAlerts();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
