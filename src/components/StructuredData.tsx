import { NonceScript } from './NonceScript';

export function WebsiteStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Crypto Vision News",
    alternateName: ["CV News", "Free Crypto News", "cryptocurrency.cv"],
    url: "https://cryptocurrency.cv",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cryptocurrency.cv/en/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Crypto Vision",
    url: "https://cryptocurrency.cv",
    logo: "https://cryptocurrency.cv/icons/icon-512x512.png",
    sameAs: [
      "https://github.com/nirholas/free-crypto-news",
      "https://x.com/nichxbt",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@cryptocurrency.cv",
      contactType: "customer support",
    },
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function NewsListStructuredData({ articles }: { articles: { title: string; link: string; pubDate: string; description?: string; imageUrl?: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "NewsArticle",
        headline: a.title,
        url: a.link,
        datePublished: a.pubDate,
        ...(a.description ? { description: a.description } : {}),
        ...(a.imageUrl ? { image: a.imageUrl } : {}),
      },
    })),
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Breadcrumb structured data for rich breadcrumb results in search
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * FAQ structured data for FAQ pages (pricing, about, etc.)
 */
export function FAQStructuredData({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * NewsArticle structured data for individual article pages
 */
export function ArticleStructuredData({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  publisher,
  section,
  keywords,
}: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  publisher?: string;
  section?: string;
  keywords?: string[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image ? { image: [image] } : {}),
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author || "Crypto Vision",
    },
    publisher: {
      "@type": "Organization",
      name: publisher || "Crypto Vision",
      url: "https://cryptocurrency.cv",
      logo: {
        "@type": "ImageObject",
        url: "https://cryptocurrency.cv/icons/icon-512x512.png",
      },
    },
    ...(section ? { articleSection: section } : {}),
    ...(keywords && keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * SoftwareApplication structured data for the API product
 */
export function SoftwareApplicationStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Crypto Vision News API",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    description:
      "Free crypto news API — real-time aggregator for Bitcoin, Ethereum, DeFi, Solana & altcoins. RSS/Atom feeds, JSON REST API, historical archive with market context. No API key required.",
    url: "https://cryptocurrency.cv/en/developers",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Crypto Vision",
      url: "https://cryptocurrency.cv",
    },
    featureList: [
      "JSON REST API",
      "RSS/Atom Feeds",
      "WebSocket Real-time Updates",
      "Historical News Archive",
      "Market Context Data",
      "AI/LLM Ready",
      "SDKs for Python, TypeScript, Go, React, PHP",
      "No API key required",
    ],
  };
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
