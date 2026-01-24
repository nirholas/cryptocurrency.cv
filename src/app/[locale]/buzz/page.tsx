import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SocialBuzz } from '@/components/SocialBuzz';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Social Buzz | Trending Crypto',
  description:
    'See what cryptocurrencies are trending on social media. Track mentions, sentiment, and buzz across Twitter, Reddit, Discord, and Telegram.',
  openGraph: {
    title: 'Social Buzz | Trending Crypto',
    description: 'See what cryptocurrencies are trending on social media.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BuzzPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Buzz</h1>
          <p className="text-gray-600 dark:text-slate-400">
            What&apos;s trending in crypto right now. Track social mentions and community sentiment.
          </p>
        </div>

        <SocialBuzz />
      </main>
      <Footer />
    </div>
  );
}
