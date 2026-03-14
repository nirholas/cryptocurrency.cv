"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const QUICK_LINKS = [
  { href: "/", label: "Latest News" },
  { href: "/markets", label: "Markets" },
  { href: "/bitcoin", label: "Bitcoin" },
  { href: "/ethereum", label: "Ethereum" },
  { href: "/defi", label: "DeFi" },
];

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page-error]", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="container-main py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold font-serif mb-4">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-4 max-w-md">
          We had trouble loading this page. The data may be temporarily
          unavailable — try again or browse another section below.
        </p>
        {error?.digest && (
          <p className="text-text-tertiary text-xs mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 mb-10">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-md border border-border text-sm font-medium hover:bg-surface-secondary transition-colors"
          >
            Go home
          </Link>
        </div>
        <nav aria-label="Quick links" className="flex flex-wrap justify-center gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
      <Footer />
    </>
  );
}
