"use client";

import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <main className="container-main py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold font-serif mb-4">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-8 max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-4">
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
      </main>
      <Footer />
    </>
  );
}
