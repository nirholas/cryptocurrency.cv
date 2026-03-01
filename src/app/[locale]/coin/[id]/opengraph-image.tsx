/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Dynamic Open Graph image for coin pages.
 * Generates social images with live coin price and 24h change.
 */

import { ImageResponse } from 'next/og';
import { COINGECKO_BASE } from '@/lib/constants';

export const runtime = 'edge';
export const alt = 'Crypto Vision News — Coin Price';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DARK_BG = '#0f172a';
const ACCENT_GRADIENT = 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)';

interface CoinSimple {
  name: string;
  symbol: string;
  market_data?: {
    current_price?: { usd?: number };
    price_change_percentage_24h?: number;
  };
}

async function fetchCoin(coinId: string): Promise<CoinSimple | null> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'FreeCryptoNews/1.0' },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

export default async function Image({ params }: { params: { locale: string; id: string } }) {
  const { id } = await params;

  let name = id.charAt(0).toUpperCase() + id.slice(1);
  let symbol = id.toUpperCase().slice(0, 5);
  let price = '';
  let change = 0;

  try {
    const coin = await fetchCoin(id);
    if (coin) {
      name = coin.name;
      symbol = coin.symbol.toUpperCase();
      const usdPrice = coin.market_data?.current_price?.usd;
      if (usdPrice) price = formatPrice(usdPrice);
      change = coin.market_data?.price_change_percentage_24h ?? 0;
    }
  } catch {
    // Use defaults
  }

  const isPositive = change >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: DARK_BG,
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isPositive
              ? 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 20%, rgba(239,68,68,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
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

          {/* Coin info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {symbol.slice(0, 3)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#f1f5f9', fontSize: '48px', fontWeight: 700 }}>
                {name}
              </span>
              <span style={{ color: '#64748b', fontSize: '24px' }}>
                {symbol}
              </span>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flex: 1 }}>
            {price ? (
              <span style={{ color: '#f1f5f9', fontSize: '72px', fontWeight: 700 }}>
                {price}
              </span>
            ) : (
              <span style={{ color: '#64748b', fontSize: '48px', fontWeight: 500 }}>
                Price unavailable
              </span>
            )}
            {change !== 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                }}
              >
                <span style={{ fontSize: '32px' }}>{isPositive ? '📈' : '📉'}</span>
                <span
                  style={{
                    color: isPositive ? '#22c55e' : '#ef4444',
                    fontSize: '32px',
                    fontWeight: 700,
                  }}
                >
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '20px' }}>
              Real-time crypto market data
            </span>
            <span style={{ color: '#64748b', fontSize: '20px' }}>
              cryptocurrency.cv
            </span>
          </div>
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
