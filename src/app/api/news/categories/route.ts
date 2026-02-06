import { getCategories } from '@/lib/crypto-news';
import { jsonResponse } from '@/lib/api-utils';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

/**
 * GET /api/news/categories
 * 
 * Returns all available news categories with source counts.
 * 
 * @example
 * curl https://cryptocurrency.cv/api/news/categories
 * 
 * Response:
 * {
 *   "categories": [
 *     { "id": "general", "name": "General", "description": "Broad crypto industry news", "sourceCount": 25 },
 *     { "id": "institutional", "name": "Institutional", "description": "VC and institutional investor insights", "sourceCount": 8 },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  const data = getCategories();
  
  return jsonResponse({
    ...data,
    usage: {
      example: '/api/news?category=institutional',
      description: 'Use the category parameter to filter news by category',
    },
  }, {
    cacheControl: 'long',
  });
}
