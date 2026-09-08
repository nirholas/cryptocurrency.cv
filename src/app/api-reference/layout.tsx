/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { headers } from 'next/headers';
import { generateSEOMetadata } from '@/lib/seo';
import { ThemeScript } from '@/components/ThemeProvider';
import '@/app/globals.css';

export const metadata = generateSEOMetadata({
  title: 'API Reference: browse, test and copy every endpoint',
  description:
    'Interactive reference for the Crypto Vision API. Search 390+ endpoints, read parameters and response schemas, run live calls from the browser, and copy ready-made cURL, JavaScript, Python and Go snippets.',
  path: '/api-reference',
  tags: ['API documentation', 'REST API', 'developer docs', 'crypto API', 'OpenAPI', 'x402'],
});

/**
 * The nonce for this render, read the same way Next.js reads it, so the theme
 * script carries the nonce that is actually in the response CSP.
 */
function readNonce(csp: string | null, xNonce: string | null): string | undefined {
  return csp?.match(/'nonce-([^']+)'/)?.[1] ?? xNonce ?? undefined;
}

/**
 * This route lives outside the `[locale]` segment, and the app's root layout
 * deliberately renders nothing but `children` (the `<html>`/`<body>` pair comes
 * from `[locale]/layout.tsx`). Without its own document shell this page shipped
 * HTML that started with a `<script>` tag and no `<html>` or `<body>` element
 * at all, which broke hydration and surfaced as a runtime TypeError in the
 * console.
 */
export default async function ApiReferenceLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = readNonce(
    requestHeaders.get('content-security-policy'),
    requestHeaders.get('x-nonce'),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        <ThemeScript nonce={nonce} />
        {children}
      </body>
    </html>
  );
}
