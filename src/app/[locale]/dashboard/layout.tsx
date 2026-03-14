/**
 * Dashboard Layout — Server component wrapper.
 * Checks authentication and redirects to login if needed.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generateSEOMetadata } from '@/lib/seo';
import { getSession } from '@/lib/auth/session';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Developer Dashboard — Crypto Vision News',
    description: 'Manage your API keys, monitor usage, and configure your crypto data integration.',
    path: '/dashboard',
    locale,
    noindex: true,
  });
}

export default async function DashboardLayout({ params, children }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession();
  } catch {
    // Auth check failed — redirect to login
  }

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <>
      <Header />
      <main id="main-content" className="container-main">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
            <DashboardSidebar session={session} />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
