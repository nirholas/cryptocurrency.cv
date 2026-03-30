/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import SearchPage from './SearchContent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Search — Crypto News',
    description: 'Search across all crypto news articles.',
    path: '/search',
    locale,
    noindex: true,
  });
}

export default SearchPage;
