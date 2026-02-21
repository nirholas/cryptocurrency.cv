import { Suspense } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
const ProtocolHealthDashboard = dynamic(
  () => import('@/components/ProtocolHealthDashboard').then(m => ({ default: m.ProtocolHealthDashboard })),
  { ssr: false }
);

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: 'Protocol Health & DeFi Risk Analysis | Free Crypto News',
  description: 'Enterprise-grade DeFi protocol risk scoring and security analysis. Monitor TVL, audits, security incidents, and team verification for 100+ protocols.',
  keywords: [
    'DeFi risk',
    'protocol safety',
    'smart contract audit',
    'TVL monitoring',
    'DeFi security',
    'protocol health',
    'crypto risk analysis',
    'DeFi insurance',
    'hack tracker',
    'exploit monitor',
  ],
  openGraph: {
    title: 'Protocol Health & DeFi Risk Analysis',
    description: 'Monitor and analyze DeFi protocol risks with our comprehensive scoring system.',
    type: 'website',
    images: [
      {
        url: '/og/protocol-health.png',
        width: 1200,
        height: 630,
        alt: 'Protocol Health Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Protocol Health & DeFi Risk Analysis',
    description: 'Enterprise-grade DeFi protocol risk scoring and security analysis.',
  },
};

// =============================================================================
// Loading Component
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-1/3" />
      
      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 pb-3">
        <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
      </div>
      
      {/* Filters skeleton */}
      <div className="flex gap-4">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="w-48 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-xl h-20" />
        ))}
      </div>
      
      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-xl h-48" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProtocolHealthPage({ params }: PageProps) {
  const { locale } = await params;
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time Risk Monitoring
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Protocol Health & Risk Analysis
            </h1>
            
            <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Enterprise-grade DeFi security intelligence. Monitor smart contract risks, 
              audit status, TVL flows, and security incidents across 100+ protocols.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <span className="text-lg">🛡️</span>
                <span>Multi-Factor Risk Scoring</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <span className="text-lg">📊</span>
                <span>TVL & Performance Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <span className="text-lg">🔍</span>
                <span>Audit Verification</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <span className="text-lg">🚨</span>
                <span>Incident Alerts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Score Methodology */}
      <section className="py-8 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">10</div>
              <div className="text-gray-500 dark:text-slate-400">Risk Factors</div>
            </div>
            <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700"></div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">A+→F</div>
              <div className="text-gray-500 dark:text-slate-400">Safety Grades</div>
            </div>
            <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700"></div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">DefiLlama</div>
              <div className="text-gray-500 dark:text-slate-400">TVL Data Source</div>
            </div>
            <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700"></div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">24/7</div>
              <div className="text-gray-500 dark:text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="container mx-auto px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <ProtocolHealthDashboard />
        </Suspense>
      </section>

      {/* Methodology Section */}
      <section className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Risk Scoring Methodology
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
              <div className="text-2xl mb-3">📜</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Smart Contract Risk
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Analysis of audit status, code complexity, upgrade patterns, and external dependencies.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Weight: 25%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
              <div className="text-2xl mb-3">🏛️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Centralization Risk
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Governance token distribution, multisig requirements, timelock periods.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Weight: 15%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
              <div className="text-2xl mb-3">🔮</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Oracle Risk
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Price feed reliability, oracle diversity, manipulation resistance.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Weight: 10%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
              <div className="text-2xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Economic Risk
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                TVL concentration, liquidity depth, yield sustainability.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Weight: 10%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
              <div className="text-2xl mb-3">👥</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Team & Track Record
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Team verification, security incident history, time in operation.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Weight: 20%
              </div>
            </div>
          </div>
          
          <div className="mt-10 max-w-3xl mx-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Grade Thresholds
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium">A+ (95-100)</span>
              <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium">A (90-94)</span>
              <span className="px-4 py-2 bg-green-400 text-white rounded-lg font-medium">A- (85-89)</span>
              <span className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">B+ (80-84)</span>
              <span className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">B (75-79)</span>
              <span className="px-4 py-2 bg-blue-400 text-white rounded-lg font-medium">B- (70-74)</span>
              <span className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium">C+ (65-69)</span>
              <span className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium">C (60-64)</span>
              <span className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium">C- (55-59)</span>
              <span className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium">D (40-54)</span>
              <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium">F (0-39)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center text-sm text-gray-500 dark:text-slate-400">
            <p className="mb-2">
              <strong>Disclaimer:</strong> Risk scores are for informational purposes only and do not constitute 
              financial advice. Always do your own research before interacting with any DeFi protocol.
            </p>
            <p>
              Data sources include DefiLlama, protocol documentation, and public security databases. 
              Scores are updated in real-time as new information becomes available.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
