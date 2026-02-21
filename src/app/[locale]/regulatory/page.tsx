/**
 * Regulatory Intelligence Page
 * 
 * Comprehensive regulatory monitoring for cryptocurrency markets:
 * - Global regulatory risk overview
 * - Jurisdiction-by-jurisdiction analysis
 * - Compliance deadline tracking
 * - Real-time regulatory event feed
 * - Agency enforcement activity monitoring
 * 
 * @module app/[locale]/regulatory
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { RegulatoryDashboard } from './RegulatoryDashboardClient';

export const metadata: Metadata = {
  title: 'Regulatory Intelligence | Crypto Compliance Tracker',
  description:
    'Real-time cryptocurrency regulatory intelligence. Track SEC, CFTC, EU MiCA, FCA enforcement actions, compliance deadlines, and global regulatory developments affecting crypto markets.',
  openGraph: {
    title: 'Regulatory Intelligence | Crypto Compliance Tracker',
    description:
      'Monitor global crypto regulations in real-time. Track enforcement actions, compliance deadlines, and regulatory developments from SEC, CFTC, EU MiCA, FCA, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Regulatory Intelligence',
    description: 'Real-time monitoring of global crypto regulations and compliance requirements.',
  },
  keywords: [
    'crypto regulation',
    'SEC crypto',
    'CFTC cryptocurrency',
    'MiCA regulation',
    'FCA crypto',
    'cryptocurrency compliance',
    'regulatory tracker',
    'crypto enforcement',
    'compliance deadlines',
    'regulatory intelligence',
  ],
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ 
    jurisdiction?: string;
    agency?: string;
    view?: 'dashboard' | 'events' | 'deadlines' | 'jurisdictions';
  }>;
}

export default async function RegulatoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view || 'dashboard';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 to-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">⚖️</span>
            <h1 className="text-3xl md:text-4xl font-bold">Regulatory Intelligence</h1>
          </div>
          <p className="text-lg text-blue-100 max-w-3xl">
            Real-time monitoring of cryptocurrency regulatory developments across 15+ jurisdictions. 
            Track enforcement actions, compliance deadlines, and market-moving regulatory events.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <QuickStat 
              icon="🌍" 
              label="Jurisdictions" 
              value="15+" 
              subtext="Countries monitored" 
            />
            <QuickStat 
              icon="🏛️" 
              label="Agencies" 
              value="30+" 
              subtext="Regulatory bodies" 
            />
            <QuickStat 
              icon="⚡" 
              label="Real-time" 
              value="24/7" 
              subtext="Continuous updates" 
            />
            <QuickStat 
              icon="🔔" 
              label="Alerts" 
              value="Instant" 
              subtext="Breaking regulatory news" 
            />
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'events', label: 'Events', icon: '📰' },
              { id: 'deadlines', label: 'Deadlines', icon: '⏰' },
              { id: 'jurisdictions', label: 'Jurisdictions', icon: '🗺️' },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={`/regulatory?view=${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <RegulatoryDashboard 
          initialJurisdiction={resolvedSearchParams.jurisdiction}
        />
      </section>

      {/* Info Section */}
      <section className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Understanding Crypto Regulation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard
              icon="🇺🇸"
              title="United States"
              description="SEC focuses on securities enforcement, CFTC regulates derivatives. The regulatory landscape remains fragmented with multiple agencies asserting jurisdiction."
              stance="cautious"
            />
            <InfoCard
              icon="🇪🇺"
              title="European Union"
              description="MiCA provides comprehensive regulatory framework for crypto-assets. Implementation ongoing with full compliance required by December 2024."
              stance="progressive"
            />
            <InfoCard
              icon="🇬🇧"
              title="United Kingdom"
              description="FCA leads crypto oversight with new marketing rules and licensing requirements. Post-Brexit regime developing independently from EU MiCA."
              stance="cautious"
            />
            <InfoCard
              icon="🇸🇬"
              title="Singapore"
              description="MAS provides clear licensing framework for crypto services. Recognized as crypto-friendly hub with robust regulatory clarity."
              stance="progressive"
            />
            <InfoCard
              icon="🇭🇰"
              title="Hong Kong"
              description="VASP licensing regime active. SFC approved platforms can serve retail investors, marking Asia's major crypto hub."
              stance="progressive"
            />
            <InfoCard
              icon="🌍"
              title="Global Standards"
              description="FATF Travel Rule requires information sharing. BIS and FSB monitoring systemic risks. International coordination increasing."
              stance="neutral"
            />
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="bg-gray-100 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Regulatory Intelligence API
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Access regulatory data programmatically for your trading systems and compliance tools.
          </p>
          
          <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`# Get regulatory events
curl "https://api.example.com/api/regulatory?action=events&jurisdiction=us"

# Get compliance deadlines
curl "https://api.example.com/api/regulatory?action=deadlines&days=90"

# Get intelligence summary
curl "https://api.example.com/api/regulatory?action=summary"

# Analyze article for regulatory content
curl "https://api.example.com/api/regulatory?action=analyze&title=SEC%20charges%20crypto%20exchange"`}
            </pre>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <Link
              href="/developers"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View API Docs
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-yellow-50 dark:bg-yellow-900/20 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Important Disclaimer</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This regulatory intelligence is provided for informational purposes only and does not constitute legal advice. 
                Always consult qualified legal counsel for compliance matters. Regulatory interpretations may vary and are 
                subject to change. We make no guarantees about the accuracy or timeliness of information presented.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Quick Stat Component
 */
function QuickStat({ 
  icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  subtext: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-blue-200">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-blue-300">{subtext}</div>
    </div>
  );
}

/**
 * Info Card Component
 */
function InfoCard({ 
  icon, 
  title, 
  description, 
  stance 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  stance: 'progressive' | 'cautious' | 'neutral' | 'restrictive';
}) {
  const stanceColors = {
    progressive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cautious: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    restrictive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${stanceColors[stance]}`}>
          {stance}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
