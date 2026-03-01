/**
 * Dashboard Layout — Server component wrapper.
 * Checks authentication and redirects to login if needed.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import { getSession } from "@/lib/auth/session";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Developer Dashboard — Free Crypto News",
    description: "Manage your API keys, monitor usage, and configure your crypto data integration.",
    path: "/dashboard",
    locale,
    noindex: true,
  });
}

export default async function DashboardLayout({ params, children }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <>
      <Header />
      <main id="main-content" className="container-main">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            <DashboardSidebar session={session} />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
