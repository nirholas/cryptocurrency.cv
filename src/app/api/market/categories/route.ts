import { NextRequest, NextResponse } from 'next/server';
import { getCategories, Category } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/market/categories
 * 
 * Get list of all cryptocurrency categories (DeFi, Gaming, L1, L2, etc.)
 * 
 * @example
 * GET /api/market/categories
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<Category[] | { error: string; message: string }>> {
  try {
    const data = await getCategories();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in categories route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: String(error) },
      { status: 500 }
    );
  }
}
