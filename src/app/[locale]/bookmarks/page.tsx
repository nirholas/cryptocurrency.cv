/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import BookmarksPage from './BookmarksContent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Bookmarks — Saved Articles',
    description: 'Your saved crypto news articles.',
    path: '/bookmarks',
    locale,
    noindex: true,
  });
}

export default BookmarksPage;
