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

const VERTICAL = NEWS_VERTICALS.find((v) => v.slug === 'web3')!;

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Web3 News — Decentralized Apps, Social, Gaming, Metaverse',
    description: VERTICAL.description,
    path: '/web3',
    locale,
    tags: ['web3', 'dapps', 'gaming', 'metaverse', 'identity', 'social'],
  });
}

export default async function Web3Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let allArticles;
  try {
    allArticles = await getNewsByCategory('nft', 50);
  } catch {
    allArticles = { articles: [], totalCount: 0 };
  }

  const web3Articles = allArticles.articles.filter((article) => {
    const verticals = classifyArticle({
      url: article.link,
      title: article.title,
      description: article.description ?? '',
    });
    return verticals.includes('web3');
  });

  return (
    <VerticalPage
      vertical={VERTICAL}
      articles={web3Articles}
      total={web3Articles.length}
      locale={locale}
    />
  );
}
