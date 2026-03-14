/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Single Author API
 * GET /api/authors/[slug]?limit=20&offset=0&source=coindesk
 */

import { NextResponse } from 'next/server';
import { getAuthorBySlug } from '@/lib/authors';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 20), 50);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
  const source = searchParams.get('source') || undefined;

  try {
    const result = await getAuthorBySlug(slug, { limit, offset, source });

    if (!result) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[/api/authors/${slug}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 },
    );
  }
}
