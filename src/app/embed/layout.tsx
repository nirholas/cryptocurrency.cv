/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Embed Widget Layout
 *
 * Minimal layout for embeddable widgets — no Header, Footer, or providers.
 * Designed to be loaded inside iframes on third-party sites.
 */

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Crypto Vision Widget",
  description: "Embeddable cryptocurrency widget by Crypto Vision",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `data-theme` lives on <html>, not <body>. The theme script below runs in
    // <head>, where `document.body` does not exist yet, so writing to it threw
    // "Cannot read properties of null (reading 'setAttribute')" and left the
    // widget on its default theme whenever the browser had not streamed the
    // body element yet. `document.documentElement` is always available there.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }
          html[data-theme="dark"] body { background: #0f172a; color: #e2e8f0; }
          html[data-theme="light"] body { background: #ffffff; color: #1e293b; }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var params = new URLSearchParams(window.location.search);
            var raw = params.get('theme') || 'dark';
            var valid = ['dark', 'light', 'auto'];
            var theme = valid.indexOf(raw) !== -1 ? raw : 'dark';
            if (theme === 'auto') {
              theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
          })();
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
