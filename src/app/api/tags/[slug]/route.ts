/**
 * Individual Tag API Route
 * 
 * GET /api/tags/[slug] - Get tag details with articles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTagBySlug, getRelatedTags, extractTagsFromArticle, generateTagStructuredData } from '@/lib/tags';
import { fetchNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300; // Cache for 5 minutes

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const tag = getTagBySlug(slug);
    
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found', slug },
        { status: 404 }
      );
    }
    
    // Get articles matching this tag
    const response = await fetchNews(50);
    const matchingArticles = response.articles.filter(article => {
      const articleTags = extractTagsFromArticle(article);
      return articleTags.some(t => t.slug === tag.slug);
    });
    
    // Get related tags
    const relatedTags = getRelatedTags(slug);
    
    // Generate structured data for SEO
    const structuredData = generateTagStructuredData(tag, matchingArticles.length);
    
    return NextResponse.json({
      tag: {
        ...tag,
        url: `/tags/${tag.slug}`,
      },
      articles: matchingArticles.map(article => ({
        title: article.title,
        link: article.link,
        description: article.description,
        source: article.source,
        pubDate: article.pubDate,
        timeAgo: article.timeAgo,
      })),
      articleCount: matchingArticles.length,
      relatedTags: relatedTags.map(t => ({
        slug: t.slug,
        name: t.name,
        icon: t.icon,
        url: `/tags/${t.slug}`,
      })),
      structuredData,
      meta: {
        title: `${tag.name} Crypto News | Latest ${tag.name} Updates`,
        description: tag.description,
        canonical: `/tags/${tag.slug}`,
      },
    });
    
  } catch (error) {
    console.error('Tag API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}
