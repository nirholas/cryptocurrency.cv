/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Dynamic Open Graph image for article pages.
 * Generates unique social images with article headline, sentiment, and tags.
 */

import { ImageResponse } from 'next/og';
import { getArticleById } from '@/lib/archive-v2';

export const runtime = 'edge';
export const alt = 'Free Crypto News Article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DARK_BG = '#0f172a';
const ACCENT_GRADIENT = 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)';

type SentimentKey = 'very_positive' | 'positive' | 'negative' | 'very_negative' | 'neutral';

const SENTIMENT: Record<SentimentKey, { label: string; color: string; bg: string; border: string }> = {
  positive: { label: 'Bullish', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
  very_positive: { label: 'Very Bullish', color: '#16a34a', bg: 'rgba(22,163,74,0.15)', border: 'rgba(22,163,74,0.4)' },
  negative: { label: 'Bearish', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
  very_negative: { label: 'Very Bearish', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)' },
  neutral: { label: 'Neutral', color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)' },
};

function getSentiment(key: string) {
  return SENTIMENT[key as SentimentKey] ?? SENTIMENT.neutral;
}

export default async function Image({ params }: { params: { locale: string; id: string } }) {
  const { id } = await params;

  let title = 'Crypto News Update';
  let sentiment = 'neutral';
  let source = '';
  let tags: string[] = [];
  let date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  try {
    const article = await getArticleById(id);
    if (article) {
      title = article.title;
      sentiment = article.sentiment?.label || 'neutral';
      source = article.source || '';
      tags = [...(article.tickers || []), ...(article.tags || [])].slice(0, 3);
      if (article.pub_date || article.first_seen) {
        date = new Date(article.pub_date || article.first_seen).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
  } catch {
    // Use defaults
  }

  const displayTitle = title.length > 110 ? title.slice(0, 110) + '\u2026' : title;
  const titleFontSize = displayTitle.length > 70 ? 40 : displayTitle.length > 50 ? 48 : 56;
  const s = getSentiment(sentiment);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: DARK_BG,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
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
            background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Source + date */}
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
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                {source}
              </span>
            </div>
          ) : (
            <div />
          )}
          <span style={{ color: '#475569', fontSize: '13px' }}>{date}</span>
        </div>

        {/* Sentiment badge */}
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
            <span style={{ color: s.color, fontSize: '14px', fontWeight: 600 }}>
              {s.label}
            </span>
          </div>
        </div>

        {/* Headline */}
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
            }}
          >
            {displayTitle}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '22px',
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
                <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 500 }}>
                  {tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Branding footer */}
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
            <span style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 600 }}>
              cryptocurrency.cv
            </span>
          </div>
          <span style={{ color: '#334155', fontSize: '13px' }}>
            Free Crypto News
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
    { ...size },
  );
}
