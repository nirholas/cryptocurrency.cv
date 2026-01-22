import { NextRequest, NextResponse } from 'next/server';
import { getCategoryCoins, TokenPrice } from '@/lib/market-data';

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
  const perPage = Math.min(
    parseInt(searchParams.get('per_page') || '100', 10),
    250
  );
  const page = parseInt(searchParams.get('page') || '1', 10);
  
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
      { error: 'Failed to fetch category coins', message: String(error) },
      { status: 500 }
    );
  }
}
