import { NextResponse } from 'next/server';
import { getAllPostsMeta } from '@/lib/blog';

/**
 * GET /api/blog/posts
 * 
 * Returns all blog posts metadata for admin dashboard
 */
export async function GET() {
  try {
    const posts = getAllPostsMeta();
    
    return NextResponse.json({
      posts,
      total: posts.length,
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
