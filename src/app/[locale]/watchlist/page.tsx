/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import WatchlistPage from './WatchlistContent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Watchlist — Track Your Coins',
    description: 'Monitor your tracked cryptocurrencies in one place.',
    path: '/watchlist',
    locale,
    noindex: true,
  });
}

export default WatchlistPage;
