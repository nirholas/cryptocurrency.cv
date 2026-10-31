/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getCategoryCoins, type TokenPrice } from '@/lib/market-data';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/market/categories/[id]
 * 
 * Get coins in a specific category
 * 
 * Query parameters:
 * - per_page: Number of coins per page (default: 100, max: 250)
 * - page: Page number (default: 1)
 * 
 * @example
 * GET /api/market/categories/decentralized-finance-defi
 * GET /api/market/categories/gaming?per_page=50&page=1
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<TokenPrice[] | { error: string; message: string }>> {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing category ID', message: 'Category ID is required' },
      { status: 400 }
    );
  }
  
  // Parse pagination parameters
  const perPage = intParam(searchParams, 'per_page', { fallback: 100, min: 1, max: 250 });
  const page = intParam(searchParams, 'page', { fallback: 1, min: 1, max: 1000 });
  
  if (isNaN(perPage) || perPage < 1) {
    return NextResponse.json(
      { error: 'Invalid per_page parameter', message: 'per_page must be a positive number' },
      { status: 400 }
    );
  }
  
  if (isNaN(page) || page < 1) {
    return NextResponse.json(
      { error: 'Invalid page parameter', message: 'Page must be a positive number' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getCategoryCoins(id, perPage, page);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in category coins route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category coins', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
