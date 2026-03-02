/**
 * Login Page — Magic link email authentication.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "@/components/auth/LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Sign In — Free Crypto News",
    description:
      "Sign in to your developer dashboard to manage API keys, view usage analytics, and configure your crypto data integration.",
    path: "/login",
    locale,
    noindex: true,
  });
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="container-main flex items-center justify-center min-h-[70vh]">
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}
