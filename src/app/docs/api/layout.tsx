/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'API Documentation — Interactive Reference',
  description:
    'Complete interactive API documentation for Free Crypto News. Try endpoints, view response schemas, and integrate crypto news into your applications.',
  path: '/docs/api',
  tags: ['API documentation', 'REST API', 'developer docs', 'crypto API', 'swagger'],
});

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
