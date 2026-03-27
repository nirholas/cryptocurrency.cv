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

const VERTICAL = NEWS_VERTICALS.find((v) => v.slug === 'defi-news')!;

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'DeFi News — Protocol Updates, Yields, Governance, TVL Tracking',
    description: VERTICAL.description,
    path: '/defi-news',
    locale,
    tags: ['defi', 'TVL', 'yield', 'governance', 'lending', 'DEX'],
  });
}

export default async function DefiNewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let allArticles;
  try {
    allArticles = await getNewsByCategory('defi', 50);
  } catch {
    allArticles = { articles: [], totalCount: 0 };
  }

  const defiArticles = allArticles.articles.filter((article) => {
    const verticals = classifyArticle({
      url: article.link,
      title: article.title,
      description: article.description ?? '',
    });
    return verticals.includes('defi-news');
  });

  return (
    <VerticalPage
      vertical={VERTICAL}
      articles={defiArticles}
      total={defiArticles.length}
      locale={locale}
    />
  );
}
