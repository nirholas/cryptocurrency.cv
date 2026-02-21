/**
 * GET /api/v1/tags
 *
 * Premium API v1 - Tags Endpoint
 * Returns all tags, filterable by category or retrievable by slug.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getAllTags, getTagsByCategory, getTagBySlug, type Tag } from '@/lib/tags';

export const runtime = 'edge';
export const revalidate = 3600;

const ENDPOINT = '/api/v1/tags';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category') as Tag['category'] | null;
    const sortParam = searchParams.get('sort');

    logger.info('Fetching tags', { slug, category });

    // Get single tag by slug
    if (slug) {
      const tag = getTagBySlug(slug);

      if (!tag) {
        return NextResponse.json(
          { error: 'Tag not found', slug, version: 'v1' },
          { status: 404 }
        );
      }

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

      return NextResponse.json(
        {
          tag: { ...tag, url: `/tags/${tag.slug}` },
          version: 'v1',
          meta: { endpoint: ENDPOINT, timestamp: new Date().toISOString() },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get tags by category
    if (category) {
      const validCategories: Tag['category'][] = ['asset', 'topic', 'event', 'technology', 'entity', 'sentiment'];

      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category', validCategories, version: 'v1' },
          { status: 400 }
        );
      }

      const tags = getTagsByCategory(category);

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

      return NextResponse.json(
        {
          category,
          count: tags.length,
          tags: tags.map(tag => ({
            ...tag,
            url: `/tags/${tag.slug}`,
          })),
          version: 'v1',
          meta: { endpoint: ENDPOINT, timestamp: new Date().toISOString() },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get all tags
    const allTags = getAllTags();

    type TagWithUrl = (typeof allTags)[number] & { url: string };
    let tagsWithUrls: TagWithUrl[] = allTags.map(tag => ({
      ...tag,
      url: `/tags/${tag.slug}`,
    }));

    // Sort by priority when requested
    if (sortParam === 'priority') {
      tagsWithUrls = tagsWithUrls.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    // Group by category
    const grouped = {
      asset: tagsWithUrls.filter(t => t.category === 'asset'),
      topic: tagsWithUrls.filter(t => t.category === 'topic'),
      event: tagsWithUrls.filter(t => t.category === 'event'),
      technology: tagsWithUrls.filter(t => t.category === 'technology'),
      entity: tagsWithUrls.filter(t => t.category === 'entity'),
      sentiment: tagsWithUrls.filter(t => t.category === 'sentiment'),
    };

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        totalCount: allTags.length,
        categories: Object.entries(grouped).map(([name, tags]) => ({
          name,
          count: tags.length,
        })),
        tags: tagsWithUrls.map(tag => ({
          slug: tag.slug,
          name: tag.name,
          icon: tag.icon,
          category: tag.category,
          priority: tag.priority,
          url: tag.url,
        })),
        version: 'v1',
        meta: { endpoint: ENDPOINT, timestamp: new Date().toISOString() },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch tags', error);
    return ApiError.internal('Failed to fetch tags', error);
  }
}
