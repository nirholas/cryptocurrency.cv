/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-main py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <span className="text-6xl mb-4">📰</span>
        <h1 className="text-4xl font-bold font-serif mb-4">Page Not Found</h1>
        <p className="text-text-secondary mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Back to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
