/**
 * Tags API Route
 * 
 * GET /api/tags - Get all tags
 * GET /api/tags?category=asset - Filter by category
 * GET /api/tags?slug=bitcoin - Get single tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllTags, getTagsByCategory, getTagBySlug, type Tag } from '@/lib/tags';

export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category') as Tag['category'] | null;
    
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
        tag,
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
          url: `/tags/${tag.slug}`,
        })),
      });
    }
    
    // Get all tags
    const allTags = getAllTags();
    
    // Group by category
    const grouped = {
      asset: allTags.filter(t => t.category === 'asset'),
      topic: allTags.filter(t => t.category === 'topic'),
      event: allTags.filter(t => t.category === 'event'),
      technology: allTags.filter(t => t.category === 'technology'),
      entity: allTags.filter(t => t.category === 'entity'),
      sentiment: allTags.filter(t => t.category === 'sentiment'),
    };
    
    return NextResponse.json({
      totalCount: allTags.length,
      categories: Object.entries(grouped).map(([name, tags]) => ({
        name,
        count: tags.length,
      })),
      tags: allTags.map(tag => ({
        slug: tag.slug,
        name: tag.name,
        icon: tag.icon,
        category: tag.category,
        priority: tag.priority,
        url: `/tags/${tag.slug}`,
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
