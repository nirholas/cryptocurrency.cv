'use client';

import { ErrorFallback } from '@/components/ErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <ErrorFallback
        error={error}
        onRetry={reset}
        title="Page Error"
        description="This page encountered an error. Please try again."
      />
    </div>
  );
}
