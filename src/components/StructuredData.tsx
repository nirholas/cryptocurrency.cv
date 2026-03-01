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
    <script
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
      "https://twitter.com/cryptocurrencycv",
    ],
  };
  return (
    <script
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
