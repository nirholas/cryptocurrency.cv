/**
 * Tags Index Page
 * Browse all news tags for SEO and navigation
 */

import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllTags, getTagsByCategory, type Tag } from '@/lib/tags';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Crypto News Tags | Browse by Topic',
    description: 'Browse cryptocurrency news by tag. Find articles about Bitcoin, Ethereum, DeFi, NFTs, regulation, and 50+ other crypto topics.',
    keywords: 'crypto news tags, bitcoin news, ethereum news, defi news, nft news, crypto regulation, cryptocurrency topics',
    openGraph: {
      title: 'Crypto News Tags | Free Crypto News',
      description: 'Browse 50+ cryptocurrency news tags. Filter articles by Bitcoin, Ethereum, DeFi, NFTs, regulation, and more.',
      type: 'website',
    },
    alternates: {
      canonical: '/tags',
    },
  };
}

// Structured data for the tags index
function generateStructuredData() {
  const tags = getAllTags();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Crypto News Tags',
    description: 'Browse cryptocurrency news by topic and tag',
    url: 'https://freecryptonews.io/tags',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tags.length,
      itemListElement: tags.slice(0, 20).map((tag, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tag.name,
        url: `https://freecryptonews.io/tags/${tag.slug}`,
      })),
    },
  };
}

function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{tag.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
            {tag.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">
            {tag.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CategorySection({ 
  title, 
  icon, 
  tags, 
  description 
}: { 
  title: string; 
  icon: string; 
  tags: Tag[]; 
  description: string;
}) {
  if (tags.length === 0) return null;
  
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map(tag => (
          <TagCard key={tag.slug} tag={tag} />
        ))}
      </div>
    </section>
  );
}

export default async function TagsPage() {
  const t = await getTranslations();
  
  const assetTags = getTagsByCategory('asset');
  const topicTags = getTagsByCategory('topic');
  const eventTags = getTagsByCategory('event');
  const technologyTags = getTagsByCategory('technology');
  const entityTags = getTagsByCategory('entity');
  const sentimentTags = getTagsByCategory('sentiment');
  
  const structuredData = generateStructuredData();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              🏷️ Browse Tags
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
              Explore cryptocurrency news by tag. Find the latest updates on Bitcoin, Ethereum, DeFi, NFTs, regulation, and 50+ other topics.
            </p>
          </div>
          
          {/* Quick Navigation */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            <a href="#assets" className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium hover:border-primary/50 transition-colors">
              ₿ Assets
            </a>
            <a href="#topics" className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium hover:border-primary/50 transition-colors">
              📚 Topics
            </a>
            <a href="#events" className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium hover:border-primary/50 transition-colors">
              📅 Events
            </a>
            <a href="#technology" className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium hover:border-primary/50 transition-colors">
              🔧 Technology
            </a>
            <a href="#entities" className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium hover:border-primary/50 transition-colors">
              🏛️ Entities
            </a>
          </div>
          
          {/* Tag Categories */}
          <div id="assets">
            <CategorySection
              title="Cryptocurrencies"
              icon="₿"
              tags={assetTags}
              description="Major cryptocurrencies and tokens"
            />
          </div>
          
          <div id="topics">
            <CategorySection
              title="Topics"
              icon="📚"
              tags={topicTags}
              description="Key themes and areas of crypto"
            />
          </div>
          
          <div id="events">
            <CategorySection
              title="Events"
              icon="📅"
              tags={eventTags}
              description="Market events and milestones"
            />
          </div>
          
          <div id="technology">
            <CategorySection
              title="Technology"
              icon="🔧"
              tags={technologyTags}
              description="Blockchain technology and infrastructure"
            />
          </div>
          
          <div id="entities">
            <CategorySection
              title="Entities"
              icon="🏛️"
              tags={entityTags}
              description="Organizations, companies, and people"
            />
          </div>
          
          <div id="sentiment">
            <CategorySection
              title="Market Sentiment"
              icon="📊"
              tags={sentimentTags}
              description="Bullish and bearish market signals"
            />
          </div>
          
          {/* SEO Content */}
          <section className="mt-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              About Our Tag System
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-slate-400">
                Our intelligent tagging system automatically categorizes crypto news articles into over 50 tags, 
                making it easy to find exactly what you&apos;re looking for. Whether you&apos;re tracking Bitcoin price movements, 
                following DeFi protocol updates, or staying informed about crypto regulation, our tags help you 
                filter the noise and focus on what matters.
              </p>
              <p className="text-gray-600 dark:text-slate-400 mt-4">
                Each tag page shows the latest news articles matching that topic, complete with real-time updates 
                from 80+ crypto news sources. Bookmark your favorite tags to create a personalized news feed.
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                🔍 Search All News
              </Link>
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                📂 Browse Topics
              </Link>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
