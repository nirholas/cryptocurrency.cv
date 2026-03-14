'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '4rem 1rem',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          We had trouble loading this page. The service may be temporarily unavailable.
        </p>
        {error?.digest && (
          <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginBottom: '2rem',
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Go home
          </a>
        </div>
        <nav style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { href: '/', label: 'Latest News' },
            { href: '/markets', label: 'Markets' },
            { href: '/bitcoin', label: 'Bitcoin' },
            { href: '/ethereum', label: 'Ethereum' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '999px',
                fontSize: '0.8125rem',
                color: '#666',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </body>
    </html>
  );
}
