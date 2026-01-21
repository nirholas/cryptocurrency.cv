import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookmarksPageContent from '@/components/BookmarksPageContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Articles - Free Crypto News',
  description: 'Your saved crypto news articles. Read later or share with others.',
};

export default function BookmarksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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
