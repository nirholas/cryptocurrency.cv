'use client';

import { ErrorFallback } from '@/components/ErrorBoundary';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <ErrorFallback
          error={error}
          onRetry={reset}
          title="Something went wrong!"
          description="An unexpected error occurred. Please try again or reload the page."
        />
      </body>
    </html>
  );
}
