/**
 * Tags API Route
 * 
 * GET /api/tags - Get all tags
 * GET /api/tags?category=asset - Filter by category
 * GET /api/tags?slug=bitcoin - Get single tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllTags, getTagsByCategory, getTagBySlug, type Tag } from '@/lib/tags';
import { loadTagScoresFromFile } from '@/lib/tagScoring';

// Node.js runtime required for filesystem access (tag scores)
export const runtime = 'nodejs';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category') as Tag['category'] | null;
    
    // Load pre-computed relevance scores once per request
    const tagScores = loadTagScoresFromFile();

    // Get single tag by slug
    if (slug) {
      const tag = getTagBySlug(slug);

      if (!tag) {
        return NextResponse.json(
          { error: 'Tag not found', slug },
          { status: 404 }
        );
      }

      return NextResponse.json({
        tag: { ...tag, score: tagScores[tag.slug] ?? 0.7 },
        url: `/tags/${tag.slug}`,
      });
    }
    
    // Get tags by category
    if (category) {
      const validCategories: Tag['category'][] = ['asset', 'topic', 'event', 'technology', 'entity', 'sentiment'];

      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category', validCategories },
          { status: 400 }
        );
      }

      const tags = getTagsByCategory(category);

      return NextResponse.json({
        category,
        count: tags.length,
        tags: tags.map(tag => ({
          ...tag,
          score: tagScores[tag.slug] ?? 0.7,
          url: `/tags/${tag.slug}`,
        })),
      });
    }
    
    // Get all tags
    const allTags = getAllTags();
    const sortParam = searchParams.get('sort');

    // Attach relevance scores
    type TagWithScore = (typeof allTags)[number] & { score: number; url: string };
    let tagsWithScores: TagWithScore[] = allTags.map(tag => ({
      ...tag,
      score: tagScores[tag.slug] ?? 0.7,
      url: `/tags/${tag.slug}`,
    }));

    // Sort by relevance score when requested
    if (sortParam === 'score') {
      tagsWithScores = tagsWithScores.sort((a, b) => b.score - a.score);
    }

    // Group by category
    const grouped = {
      asset:      tagsWithScores.filter(t => t.category === 'asset'),
      topic:      tagsWithScores.filter(t => t.category === 'topic'),
      event:      tagsWithScores.filter(t => t.category === 'event'),
      technology: tagsWithScores.filter(t => t.category === 'technology'),
      entity:     tagsWithScores.filter(t => t.category === 'entity'),
      sentiment:  tagsWithScores.filter(t => t.category === 'sentiment'),
    };

    return NextResponse.json({
      totalCount: allTags.length,
      categories: Object.entries(grouped).map(([name, tags]) => ({
        name,
        count: tags.length,
      })),
      tags: tagsWithScores.map(tag => ({
        slug:     tag.slug,
        name:     tag.name,
        icon:     tag.icon,
        category: tag.category,
        priority: tag.priority,
        score:    tag.score,
        url:      tag.url,
      })),
    });
    
  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
