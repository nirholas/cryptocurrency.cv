/**
 * Source Credibility API
 * 
 * Get credibility scores for news sources.
 * 
 * GET /api/analytics/credibility
 * Query params:
 *   - source: Specific source key (optional)
 *   - sortBy: score | accuracy | timeliness (default: score)
 */

import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { 
  getSourceCredibility, 
  getSourceScore,
  getCredibilityStats 
} from '@/lib/source-credibility';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Parse query parameters
  const source = searchParams.get('source') || undefined;
  const sortBy = (searchParams.get('sortBy') || 'score') as 'score' | 'accuracy' | 'timeliness';
  
  // Validate sortBy
  if (!['score', 'accuracy', 'timeliness'].includes(sortBy)) {
    return errorResponse(
      'Invalid sortBy parameter',
      'sortBy must be one of: score, accuracy, timeliness',
      400
    );
  }
  
  try {
    let result;
    
    if (source) {
      // Get single source credibility
      const sourceScore = await getSourceScore(source);
      
      if (!sourceScore) {
        return errorResponse(
          'Source not found',
          `No credibility data available for source: ${source}`,
          404
        );
      }
      
      result = {
        source: sourceScore,
        generatedAt: new Date().toISOString(),
      };
    } else {
      // Get all sources
      result = await getSourceCredibility({ source, sortBy });
    }
    
    // Add stats
    const stats = getCredibilityStats();
    
    const responseData = withTiming({
      ...result,
      params: { source, sortBy },
      stats,
    }, startTime);
    
    return jsonResponse(responseData, {
      cacheControl: 'ai', // Longer cache for credibility scores
      etag: true,
      request,
    });
  } catch (error) {
    console.error('Credibility scoring error:', error);
    return errorResponse(
      'Failed to get credibility scores',
      error instanceof Error ? error.message : String(error)
    );
  }
}
