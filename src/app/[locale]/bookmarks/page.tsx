import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookmarksPageContent from '@/components/BookmarksPageContent';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Saved Articles',
  description: 'Your saved crypto news articles. Read later or share with others.',
  path: '/bookmarks',
  noindex: true,
});

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BookmarksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="px-4 py-8">
          <BookmarksPageContent />
        </main>
        <Footer />
      </div>
    </div>
  );
}
