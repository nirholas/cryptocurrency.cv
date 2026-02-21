import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClickbaitDashboard from '@/app/[locale]/clickbait/ClickbaitDashboard';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Clickbait Detector',
    description: 'AI-powered detection of clickbait headlines in crypto news. Filter low-quality content and find the most credible crypto stories.',
    path: '/clickbait',
    tags: ['clickbait detection', 'crypto news quality', 'headline analysis', 'news filter', 'content quality'],
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ClickbaitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Clickbait Detector</h1>
          <p className="text-gray-400">
            AI analysis of headline quality and clickbait scoring.
          </p>
        </div>
        <ClickbaitDashboard />
      </main>
      <Footer />
    </div>
  );
}
