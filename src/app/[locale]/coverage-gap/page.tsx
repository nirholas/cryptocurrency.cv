import { getTranslations } from 'next-intl/server';
import CoverageGapDashboard from './CoverageGapDashboard';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: `Coverage Gap Analysis | ${t('title')}`,
    description: 'Identify under-covered crypto topics and stories. Find news coverage gaps and opportunities.',
    openGraph: {
      title: `Coverage Gap Analysis | ${t('title')}`,
      description: 'Identify under-covered crypto topics and stories. Find news coverage gaps and opportunities.',
    },
  };
}

export default async function CoverageGapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
              Coverage Gap Analysis
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Identify under-covered crypto topics and emerging stories. Find opportunities 
            in news coverage gaps and track topic trends across sources.
          </p>
        </div>

        {/* Educational Banner */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 mb-8 border border-purple-700/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔍</div>
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                How Coverage Gap Analysis Works
              </h3>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Analyzes article frequency, recency, and source diversity for each topic</li>
                <li>• Identifies trending topics that lack sufficient coverage</li>
                <li>• Suggests story angles for under-covered areas</li>
                <li>• Tracks source diversity to ensure balanced news intake</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <CoverageGapDashboard />

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Coverage analysis is updated every 15 minutes. Gap severity is based on 
            topic importance and coverage frequency.
          </p>
        </div>
      </div>
    </div>
  );
}
