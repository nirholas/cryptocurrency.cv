/**
 * DeFi Protocol Detail Page
 * Shows comprehensive protocol information: TVL, chains, category, and related news
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  getProtocolBySlug, 
  getTopProtocols,
  formatNumber, 
  formatPercent,
} from '@/lib/market-data';
import { searchNews } from '@/lib/crypto-news';
import Posts from '@/components/Posts';
import ProtocolImage from '@/components/ProtocolImage';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

// Enable on-demand ISR for protocols not pre-rendered
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const protocol = await getProtocolBySlug(slug);
  
  if (!protocol) {
    return {
      title: 'Protocol Not Found',
      description: 'The requested DeFi protocol could not be found.',
    };
  }
  
  return {
    title: `${protocol.name} - DeFi Protocol`,
    description: protocol.description || `${protocol.name} DeFi protocol with $${formatNumber(protocol.tvl)} TVL. Category: ${protocol.category}. Chains: ${protocol.chains?.join(', ') || protocol.chain}.`,
    openGraph: {
      title: `${protocol.name} - DeFi Protocol`,
      description: protocol.description || `${protocol.name} DeFi protocol analytics and news`,
      type: 'website',
      images: protocol.logo ? [protocol.logo] : undefined,
    },
  };
}

export const revalidate = 300; // Revalidate every 5 minutes

/**
 * Generate static params for all locale + protocol combinations
 */
export async function generateStaticParams() {
  // Skip during Vercel build - use ISR instead
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  const protocols = await getTopProtocols(50);
  
  return locales.flatMap((locale) =>
    protocols.map((protocol) => ({
      locale,
      slug: protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, '-'),
    }))
  );
}

export default async function ProtocolPage({ params }: Props) {
  const { slug } = await params;
  const [protocol, relatedProtocols] = await Promise.all([
    getProtocolBySlug(slug),
    getTopProtocols(10),
  ]);
  
  if (!protocol) {
    notFound();
  }
  
  // Get related news
  const newsData = await searchNews(protocol.name, 10);
  
  // Get similar protocols (same category)
  const similarProtocols = relatedProtocols
    .filter(p => p.category === protocol.category && p.id !== protocol.id)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/defi" className="hover:text-gray-900 dark:hover:text-white transition-colors">DeFi</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-900 dark:text-white">{protocol.name}</li>
            </ol>
          </nav>

          {/* Protocol Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Logo & Name */}
              <div className="flex items-center gap-4">
                {protocol.logo && (
                  <ProtocolImage 
                    src={protocol.logo} 
                    alt={protocol.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl"
                  />
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {protocol.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {protocol.symbol && (
                      <span className="text-gray-500 dark:text-slate-400 font-medium">{protocol.symbol}</span>
                    )}
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-full">
                      {protocol.category}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-auto">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">TVL</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(protocol.tvl)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">24h Change</p>
                  <p className={`text-xl md:text-2xl font-bold ${(protocol.change_1d || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercent(protocol.change_1d)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">7d Change</p>
                  <p className={`text-xl md:text-2xl font-bold ${(protocol.change_7d || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercent(protocol.change_7d)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Chains</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{protocol.chains?.length || 1}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {protocol.description && (
              <p className="text-gray-600 dark:text-slate-300 mt-6 leading-relaxed">
                {protocol.description}
              </p>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              {protocol.url && (
                <a
                  href={protocol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  🌐 Website
                </a>
              )}
              {protocol.twitter && (
                <a
                  href={`https://twitter.com/${protocol.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition"
                >
                  𝕏 Twitter
                </a>
              )}
              <a
                href={`https://defillama.com/protocol/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition"
              >
                📊 DeFiLlama
              </a>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Chain Distribution */}
              {protocol.chains && protocol.chains.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">⛓️ Chain Distribution</h2>
                  <div className="flex flex-wrap gap-2">
                    {protocol.chains.map(chain => (
                      <Link
                        key={chain}
                        href={`/defi/chain/${chain.toLowerCase()}`}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition"
                      >
                        {chain}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Data */}
              {(protocol.mcap || protocol.fdv) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">💰 Market Data</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {protocol.mcap && (
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Market Cap</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">${formatNumber(protocol.mcap)}</p>
                      </div>
                    )}
                    {protocol.fdv && (
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Fully Diluted Valuation</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">${formatNumber(protocol.fdv)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related News */}
              {newsData.articles.length > 0 && (
                <div>
                  <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-4">📰 Latest News about {protocol.name}</h2>
                  <Posts articles={newsData.articles} />
                </div>
              )}
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Audits */}
              {protocol.audit_links && protocol.audit_links.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">🔒 Security Audits</h2>
                  <div className="space-y-2">
                    {protocol.audit_links.map((audit, idx) => (
                      <a
                        key={idx}
                        href={audit}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 dark:text-blue-400 hover:underline text-sm truncate"
                      >
                        Audit Report {idx + 1} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Protocols */}
              {similarProtocols.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Similar Protocols</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Other {protocol.category} protocols</p>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                    {similarProtocols.map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/defi/protocol/${p.slug || p.id}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          {p.logo && (
                            <ProtocolImage 
                              src={p.logo} 
                              alt={p.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                        </div>
                        <span className="text-gray-500 dark:text-slate-400">${formatNumber(p.tvl)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">📊 Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/defi" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to DeFi Dashboard
                  </Link>
                  <Link href="/category/defi" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    All DeFi News →
                  </Link>
                </div>
              </div>

              {/* Data Source */}
              <div className="text-center text-gray-500 dark:text-slate-400 text-sm">
                <p>
                  Data from{' '}
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    DeFiLlama
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
