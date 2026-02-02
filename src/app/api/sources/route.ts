import { NextResponse, NextRequest } from 'next/server';
import { getSources } from '@/lib/crypto-news';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Fetching sources');
    const data = await getSources();
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch sources', error);
    return ApiError.internal('Failed to fetch sources', error);
  }
}
