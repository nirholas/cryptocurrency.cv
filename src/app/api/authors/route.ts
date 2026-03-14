/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Authors Listing API
 * GET /api/authors?limit=50&offset=0&sort=articles|recent|name&search=query
 */

import { NextResponse } from 'next/server';
import { getAuthors } from '@/lib/authors';

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 50), 100);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
  const sort = (['articles', 'recent', 'name'] as const).includes(
    searchParams.get('sort') as 'articles' | 'recent' | 'name',
  )
    ? (searchParams.get('sort') as 'articles' | 'recent' | 'name')
    : 'articles';
  const search = searchParams.get('search') || undefined;

  try {
    const result = await getAuthors({ limit, offset, sort, search });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/authors] Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 },
    );
  }
}
