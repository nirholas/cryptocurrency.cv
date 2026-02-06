/**
 * Structured Data Components
 * JSON-LD schema.org markup for SEO
 */

import type { EnrichedArticle } from '@/lib/archive-v2';

interface ArticleStructuredDataProps {
  article: EnrichedArticle;
  url: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

interface WebsiteStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
}

/**
 * Article structured data (NewsArticle schema)
 */
export function ArticleStructuredData({ article, url }: ArticleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description || article.title,
    datePublished: article.pub_date || article.first_seen,
    dateModified: article.last_seen || article.pub_date || article.first_seen,
    author: {
      '@type': 'Organization',
      name: article.source,
      url: article.link,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Free Crypto News',
      url: 'https://cryptocurrency.cv',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cryptocurrency.cv/icons/icon-512x512.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: 'Cryptocurrency',
    keywords: [...article.tickers, ...article.tags].join(', '),
    about: article.tickers.map(ticker => ({
      '@type': 'Thing',
      name: ticker,
    })),
    mentions: [
      ...article.entities.companies.map(company => ({
        '@type': 'Organization',
        name: company,
      })),
      ...article.entities.people.map(person => ({
        '@type': 'Person',
        name: person,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Website structured data (for homepage)
 */
export function WebsiteStructuredData({ 
  name = 'Free Crypto News',
  description = '100% free crypto news API. No API keys. No rate limits. Real-time cryptocurrency news aggregation.',
  url = 'https://cryptocurrency.cv'
}: WebsiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Free Crypto News',
      url,
      logo: {
        '@type': 'ImageObject',
        url: `${url}/icons/icon-512x512.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Organization structured data
 */
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Free Crypto News',
    url: 'https://cryptocurrency.cv',
    logo: 'https://cryptocurrency.cv/icons/icon-512x512.png',
    description: '100% free crypto news API aggregating news from CoinDesk, The Block, Decrypt, and more.',
    sameAs: [
      'https://github.com/nirholas/free-crypto-news',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: 'https://github.com/nirholas/free-crypto-news/issues',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * FAQ structured data (for API documentation page)
 */
export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * ItemList structured data (for news feed pages)
 */
export function NewsListStructuredData({ 
  articles,
  listName = 'Crypto News Articles'
}: { 
  articles: Array<{ title: string; link: string; description?: string; pubDate: string }>;
  listName?: string;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: articles.length,
    itemListElement: articles.slice(0, 10).map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.description || article.title,
        datePublished: article.pubDate,
        url: article.link,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * SoftwareApplication structured data (for API/Developer pages)
 */
export function APIStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Crypto News API',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'All',
    description: '100% free crypto news API. No API keys required. No rate limits. Real-time cryptocurrency news aggregation from 200+ sources.',
    url: 'https://cryptocurrency.cv/developers',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time news from 200+ sources',
      'AI-powered analysis',
      'Market data integration',
      'WebSocket streaming',
      'Multiple language support',
    ],
    author: {
      '@type': 'Organization',
      name: 'Free Crypto News',
      url: 'https://cryptocurrency.cv',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * FinancialProduct structured data (for crypto coin pages)
 */
export function CryptoAssetStructuredData({
  name,
  symbol,
  price,
  priceChange24h,
  marketCap,
  image,
  url,
}: {
  name: string;
  symbol: string;
  price: number;
  priceChange24h?: number;
  marketCap?: number;
  image?: string;
  url: string;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${name} (${symbol.toUpperCase()})`,
    description: `${name} cryptocurrency - real-time price, news, and market data`,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Free Crypto News',
    },
    ...(image && { image }),
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 60000).toISOString(), // Valid for 1 minute
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * VideoObject structured data (for pages with embedded videos)
 */
export function VideoStructuredData({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  embedUrl,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  embedUrl?: string;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    ...(duration && { duration }),
    ...(embedUrl && { embedUrl }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
