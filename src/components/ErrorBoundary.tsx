'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show reset button */
  showReset?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error}
          onReset={this.props.showReset !== false ? this.handleReset : undefined}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          )}
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone ErrorFallback component for use outside ErrorBoundary
 * Used by Next.js error.tsx and global-error.tsx
 */
export interface ErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  description = 'We encountered an unexpected error. Please try again or return to the homepage.'
}: ErrorFallbackProps) {
  return (
    <div className="max-w-md w-full text-center">
      {/* Error icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      
      <p className="text-gray-600 dark:text-slate-400 mb-6">
        {description}
      </p>

      {/* Error details (development only) */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        )}
        <Link
          href="/"
          className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

// Higher-order component version
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
