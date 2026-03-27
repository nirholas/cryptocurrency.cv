/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Crypto Vision',
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          404 — Page not found
        </h1>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/en"
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Go home
        </a>
      </body>
    </html>
  );
}
