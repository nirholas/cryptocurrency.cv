/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Dynamic OG Image API Route
 * GET /api/og?title=&sentiment=&price_change=&tags=&source=&date=
 * GET /api/og?tag=&count=&tag_sentiment=&date=   (tag page layout)
 * GET /api/og?preview=true                        (sample image for visual testing)
 *
 * Returns a 1200×630 PNG image suitable for Open Graph / Twitter Cards.
 */

import { type NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Preview / sample data
// ---------------------------------------------------------------------------
const PREVIEW = {
  title: 'Bitcoin Surges Past $100K Amid Institutional FOMO',
  sentiment: 'bullish',
  price_change: 'BTC +5.2%',
  tags: 'Bitcoin,DeFi,Layer 2',
  source: 'CoinDesk',
};

// ---------------------------------------------------------------------------
// Sentiment config
// ---------------------------------------------------------------------------
type SentimentKey =
  | 'bullish'
  | 'very_bullish'
  | 'bearish'
  | 'very_bearish'
  | 'neutral';

const SENTIMENT: Record<
  SentimentKey,
  { label: string; color: string; bg: string; border: string }
> = {
  bullish: {
    label: 'Bullish',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.4)',
  },
  very_bullish: {
    label: 'Very Bullish',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.15)',
    border: 'rgba(22,163,74,0.4)',
  },
  bearish: {
    label: 'Bearish',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
  },
  very_bearish: {
    label: 'Very Bearish',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.4)',
  },
  neutral: {
    label: 'Neutral',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.15)',
    border: 'rgba(234,179,8,0.4)',
  },
};

function getSentiment(key: string) {
  return SENTIMENT[key as SentimentKey] ?? SENTIMENT.neutral;
}

// ---------------------------------------------------------------------------
// Shared CSS constants
// ---------------------------------------------------------------------------
const DARK_BG = '#0f172a';
const GRID_BG =
  'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), ' +
  'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)';
const ACCENT_GRADIENT =
  'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)';

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const isPreview = sp.get('preview') === 'true';

  /* ---- resolve params ---- */
  const rawTitle = isPreview
    ? PREVIEW.title
    : sp.get('title') || 'Crypto News Update';
  const sentiment = isPreview ? PREVIEW.sentiment : sp.get('sentiment') || 'neutral';
  const priceChange = isPreview ? PREVIEW.price_change : sp.get('price_change') || '';
  const tagsParam = isPreview ? PREVIEW.tags : sp.get('tags') || '';
  const source = isPreview ? PREVIEW.source : sp.get('source') || '';

  // Tag page params
  const tagName = sp.get('tag') || '';
  const articleCount = sp.get('count') || '';
  const tagSentiment = sp.get('tag_sentiment') || sentiment;

  const date =
    sp.get('date') ||
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const isTagPage = !!tagName && !sp.get('title') && !isPreview;

  /* ---- derived values ---- */
  const title = rawTitle.length > 110 ? rawTitle.slice(0, 110) + '\u2026' : rawTitle;
  const tags = tagsParam
    ? tagsParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const s = getSentiment(sentiment);
  const ts = getSentiment(tagSentiment);

  const priceChangePositive = priceChange && !priceChange.includes('-');
  const priceColor = priceChangePositive ? '#22c55e' : '#ef4444';

  const titleFontSize = title.length > 70 ? 40 : title.length > 50 ? 48 : 56;

  /* ---- render ---- */
  return new ImageResponse(
    isTagPage ? (
      // ------------------------------------------------------------------ //
      // TAG PAGE LAYOUT
      // ------------------------------------------------------------------ //
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: DARK_BG,
          backgroundImage: GRID_BG,
          backgroundSize: '40px 40px',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
            <span
              style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 600 }}
            >
              cryptocurrency.cv
            </span>
          </div>
          <span style={{ color: '#475569', fontSize: '14px' }}>{date}</span>
        </div>

        {/* TAG badge */}
        <div
          style={{
            display: 'flex',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: '8px',
              padding: '5px 14px',
            }}
          >
            <span
              style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 600 }}
            >
              TAG
            </span>
          </div>
        </div>

        {/* Tag name */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'flex-start',
            position: 'relative',
          }}
        >
          <span
            style={{
              color: '#f8fafc',
              fontSize: '72px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            #{tagName}
          </span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '40px',
            position: 'relative',
          }}
        >
          {articleCount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 20px',
              }}
            >
              <span style={{ color: '#64748b', fontSize: '14px' }}>
                Articles
              </span>
              <span
                style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {articleCount}
              </span>
            </div>
          )}
          {tagSentiment && tagSentiment !== 'neutral' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: ts.bg,
                border: `1px solid ${ts.border}`,
                borderRadius: '10px',
                padding: '10px 20px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: ts.color,
                }}
              />
              <span
                style={{
                  color: ts.color,
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Trending {ts.label}
              </span>
            </div>
          )}
        </div>

        {/* Bottom brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <span style={{ color: '#334155', fontSize: '13px' }}>
            Free Crypto News · No API key required
          </span>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: ACCENT_GRADIENT,
          }}
        />
      </div>
    ) : (
      // ------------------------------------------------------------------ //
      // ARTICLE PAGE LAYOUT
      // ------------------------------------------------------------------ //
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: DARK_BG,
          backgroundImage: GRID_BG,
          backgroundSize: '40px 40px',
          padding: '52px 60px 44px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Row 1: source + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            position: 'relative',
          }}
        >
          {source ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '5px 14px',
              }}
            >
              <span
                style={{
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {source}
              </span>
            </div>
          ) : (
            <div />
          )}
          <span style={{ color: '#475569', fontSize: '13px' }}>{date}</span>
        </div>

        {/* Row 2: sentiment badge + price change */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '26px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: '8px',
              padding: '6px 16px',
            }}
          >
            <div
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: s.color,
              }}
            />
            <span
              style={{ color: s.color, fontSize: '14px', fontWeight: 600 }}
            >
              {s.label}
            </span>
          </div>

          {priceChange && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px 16px',
              }}
            >
              <span
                style={{
                  color: priceColor,
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {priceChange}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: headline (flex-1 so it fills remaining space) */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'flex-start',
            position: 'relative',
          }}
        >
          <span
            style={{
              color: '#f8fafc',
              fontSize: `${titleFontSize}px`,
              fontWeight: 800,
              lineHeight: 1.22,
              letterSpacing: '-0.02em',
              maxWidth: '1020px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </span>
        </div>

        {/* Row 4: tags pills */}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '22px',
              flexWrap: 'nowrap',
              position: 'relative',
            }}
          >
            {tags.map((tag, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: '20px',
                  padding: '5px 14px',
                }}
              >
                <span
                  style={{
                    color: '#a5b4fc',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Row 5: branding footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
            <span
              style={{
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              cryptocurrency.cv
            </span>
          </div>
          <span style={{ color: '#334155', fontSize: '13px' }}>
            Free Crypto News API · No auth required
          </span>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: ACCENT_GRADIENT,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
