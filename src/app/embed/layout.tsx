/**
 * Embed Widget Layout
 *
 * Minimal layout for embeddable widgets — no Header, Footer, or providers.
 * Designed to be loaded inside iframes on third-party sites.
 */

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Crypto Vision News Widget",
  description: "Embeddable cryptocurrency widget by Crypto Vision News",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }
          body[data-theme="dark"] { background: #0f172a; color: #e2e8f0; }
          body[data-theme="light"] { background: #ffffff; color: #1e293b; }
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
            document.body.setAttribute('data-theme', theme);
          })();
        `}} />
      </head>
      <body data-theme="dark">
        {children}
      </body>
    </html>
  );
}
