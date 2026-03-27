/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import { generateSEOMetadata } from '@/lib/seo';
import { getNewsByCategory } from '@/lib/crypto-news';
import { NEWS_VERTICALS } from '@/lib/verticals';
import { classifyArticle } from '@/lib/article-classifier';
import VerticalPage from '@/components/VerticalPage';
import type { Metadata } from 'next';

const VERTICAL = NEWS_VERTICALS.find((v) => v.slug === 'business')!;

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Business News — Funding, M&A, Institutional Adoption',
    description: VERTICAL.description,
    path: '/business',
    locale,
    tags: ['business', 'funding', 'institutional', 'M&A', 'crypto corporate'],
  });
}

export default async function BusinessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let allArticles;
  try {
    allArticles = await getNewsByCategory('bitcoin', 50);
  } catch {
    allArticles = { articles: [], totalCount: 0 };
  }

  // Filter articles that classify into business vertical
  const businessArticles = allArticles.articles.filter((article) => {
    const verticals = classifyArticle({
      url: article.link,
      title: article.title,
      description: article.description ?? '',
    });
    return verticals.includes('business');
  });

  return (
    <VerticalPage
      vertical={VERTICAL}
      articles={businessArticles}
      total={businessArticles.length}
      locale={locale}
    />
  );
}
