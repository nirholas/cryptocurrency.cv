/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Default Open Graph image for pages without a dynamic one.
 * Next.js automatically serves this at /opengraph-image and
 * injects the appropriate <meta property="og:image"> tag.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Free Crypto News — Free Real-Time Crypto News API';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: '#0f172a',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(247,147,26,0.4)',
              }}
            >
              <span style={{ fontSize: '28px', fontWeight: 900, fontFamily: "Georgia,'Times New Roman',serif", color: '#F7931A' }}>N</span>
            </div>
            <span style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700 }}>
              Free Crypto News
            </span>
          </div>
          <span style={{ color: '#64748b', fontSize: '16px' }}>
            cryptocurrency.cv
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              color: '#f8fafc',
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Free Real-Time
            <br />
            Crypto News API
          </h1>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '24px',
              lineHeight: 1.4,
              maxWidth: '700px',
            }}
          >
            300+ sources · No API key · Bitcoin, Ethereum, DeFi &amp; altcoins
          </p>
        </div>

        {/* Bottom badges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['JSON API', 'RSS/Atom', 'WebSocket', 'SDKs', 'AI Ready'].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93c5fd',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
