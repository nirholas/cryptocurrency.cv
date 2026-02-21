import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeveloperPortalContent from './DeveloperPortalContent';
import { APIStructuredData, BreadcrumbStructuredData, OrganizationStructuredData } from '@/components/StructuredData';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Developer Portal',
    description: 'Get your API key and access comprehensive documentation for the Free Crypto News API. Build crypto apps in minutes with REST, RSS, and WebSocket.',
    path: '/developers',
    tags: ['crypto API', 'developer portal', 'API key', 'REST API', 'cryptocurrency data'],
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <APIStructuredData />
      <OrganizationStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: 'https://cryptocurrency.cv' },
          { name: 'Developer Portal', url: 'https://cryptocurrency.cv/developers' },
        ]}
      />
      <Header />
      <main className="pt-16">
        <DeveloperPortalContent />
      </main>
      <Footer />
    </div>
  );
}
