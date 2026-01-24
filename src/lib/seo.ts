/**
 * SEO Utilities
 * Helper functions for generating optimized metadata
 */

import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://free-crypto-news.vercel.app';

interface SEOConfig {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  noindex?: boolean;
}

/**
 * Generate comprehensive metadata for any page
 * Includes Open Graph, Twitter Cards, and proper alternates
 */
export function generateSEOMetadata({
  title,
  description,
  path = '',
  locale = 'en',
  image = '/og-image.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  authors = ['Free Crypto News'],
  tags = [],
  noindex = false,
}: SEOConfig): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  
  // Truncate description to 160 chars for SEO
  const truncatedDescription = description.length > 160 
    ? description.slice(0, 157) + '...' 
    : description;

  return {
    title,
    description: truncatedDescription,
    keywords: tags.length > 0 ? tags : undefined,
    authors: authors.map(name => ({ name })),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: truncatedDescription,
      url,
      siteName: 'Free Crypto News',
      type,
      locale: locale.replace('-', '_'),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors,
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: truncatedDescription,
      images: [imageUrl],
      creator: '@freecryptonews',
    },
    robots: noindex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

/**
 * Generate article-specific metadata with enhanced schema
 */
export function generateArticleMetadata({
  title,
  description,
  slug,
  locale = 'en',
  image,
  publishedTime,
  modifiedTime,
  author,
  category,
  tags = [],
}: {
  title: string;
  description: string;
  slug: string;
  locale?: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  tags?: string[];
}): Metadata {
  return generateSEOMetadata({
    title: `${title} | Free Crypto News`,
    description,
    path: `/blog/${slug}`,
    locale,
    image,
    type: 'article',
    publishedTime,
    modifiedTime: modifiedTime || publishedTime,
    authors: author ? [author] : ['Free Crypto News'],
    tags: [...tags, category].filter(Boolean) as string[],
  });
}

/**
 * Generate coin page metadata
 */
export function generateCoinMetadata({
  name,
  symbol,
  locale = 'en',
  price,
  priceChange,
}: {
  name: string;
  symbol: string;
  locale?: string;
  price?: number;
  priceChange?: number;
}): Metadata {
  const priceStr = price ? ` - $${price.toLocaleString()}` : '';
  const changeStr = priceChange 
    ? ` (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`
    : '';
  
  return generateSEOMetadata({
    title: `${name} (${symbol.toUpperCase()}) Price${priceStr}${changeStr}`,
    description: `Get the latest ${name} (${symbol.toUpperCase()}) price, news, charts, and market data. Real-time updates from Free Crypto News.`,
    path: `/coin/${name.toLowerCase().replace(/\s+/g, '-')}`,
    locale,
    tags: [name, symbol, 'cryptocurrency', 'crypto', 'price', 'news', 'market data'],
  });
}

/**
 * Generate category page metadata
 */
export function generateCategoryMetadata({
  category,
  description,
  locale = 'en',
  articleCount,
}: {
  category: string;
  description: string;
  locale?: string;
  articleCount?: number;
}): Metadata {
  const countStr = articleCount ? ` - ${articleCount} articles` : '';
  
  return generateSEOMetadata({
    title: `${category} Crypto News${countStr}`,
    description: description || `Latest ${category} cryptocurrency news and updates. Stay informed with Free Crypto News.`,
    path: `/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
    locale,
    tags: [category, 'cryptocurrency', 'crypto news', 'blockchain'],
  });
}

/**
 * Clean and optimize title for SEO
 * - Removes excess whitespace
 * - Truncates to optimal length (50-60 chars)
 * - Ensures brand suffix
 */
export function optimizeTitle(title: string, includeBrand = true): string {
  const cleaned = title.trim().replace(/\s+/g, ' ');
  const brand = ' | Free Crypto News';
  const maxLength = includeBrand ? 60 - brand.length : 60;
  
  if (cleaned.length <= maxLength) {
    return includeBrand ? cleaned + brand : cleaned;
  }
  
  // Truncate at word boundary
  const truncated = cleaned.slice(0, maxLength).replace(/\s+\S*$/, '');
  return includeBrand ? truncated + '...' + brand : truncated + '...';
}

/**
 * Clean and optimize description for SEO
 * - Removes HTML tags
 * - Truncates to optimal length (150-160 chars)
 */
export function optimizeDescription(description: string): string {
  // Remove HTML tags
  const cleaned = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length <= 160) {
    return cleaned;
  }
  
  // Truncate at word boundary, ending with a period if possible
  const truncated = cleaned.slice(0, 157);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > 100) {
    return truncated.slice(0, lastPeriod + 1);
  }
  
  return truncated.replace(/\s+\S*$/, '') + '...';
}
