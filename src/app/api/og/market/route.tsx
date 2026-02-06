/**
 * Dynamic OG Image Generator for Market Pages
 * Generates social share images with market stats for viral sharing
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type') || 'overview'; // overview, gainers, losers, trending
  const btcPrice = searchParams.get('btc') || '$0';
  const btcChange = searchParams.get('btc_change') || '0';
  const ethPrice = searchParams.get('eth') || '$0';
  const ethChange = searchParams.get('eth_change') || '0';
  const fearGreed = searchParams.get('fear_greed') || '50';
  const fearGreedLabel = searchParams.get('fear_greed_label') || 'Neutral';
  
  const btcChangeNum = parseFloat(btcChange);
  const ethChangeNum = parseFloat(ethChange);
  const fearGreedNum = parseInt(fearGreed);
  
  const titles: Record<string, string> = {
    overview: 'Crypto Market Overview',
    gainers: 'Top Gainers Today',
    losers: 'Biggest Losers Today',
    trending: 'Trending Cryptocurrencies',
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return '#ef4444'; // Extreme Fear - Red
    if (value <= 45) return '#f97316'; // Fear - Orange
    if (value <= 55) return '#eab308'; // Neutral - Yellow
    if (value <= 75) return '#84cc16'; // Greed - Light green
    return '#22c55e'; // Extreme Greed - Green
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          padding: '48px',
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
            background: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                📰
              </div>
              <span style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700 }}>
                Free Crypto News
              </span>
            </div>
            
            {/* Fear & Greed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: `4px solid ${getFearGreedColor(fearGreedNum)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: getFearGreedColor(fearGreedNum), fontSize: '24px', fontWeight: 700 }}>
                  {fearGreed}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Fear & Greed</span>
                <span style={{ color: getFearGreedColor(fearGreedNum), fontSize: '18px', fontWeight: 600 }}>
                  {fearGreedLabel}
                </span>
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h1 style={{ color: '#f1f5f9', fontSize: '56px', fontWeight: 700, marginBottom: '40px' }}>
            {titles[type] || titles.overview}
          </h1>
          
          {/* Price cards */}
          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            {/* BTC Card */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '32px',
                borderRadius: '16px',
                backgroundColor: 'rgba(247, 147, 26, 0.1)',
                border: '1px solid rgba(247, 147, 26, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px' }}>₿</span>
                <span style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 600 }}>Bitcoin</span>
              </div>
              <span style={{ color: '#f1f5f9', fontSize: '42px', fontWeight: 700 }}>
                {btcPrice}
              </span>
              <span
                style={{
                  color: btcChangeNum >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: '24px',
                  fontWeight: 600,
                  marginTop: '8px',
                }}
              >
                {btcChangeNum >= 0 ? '↑' : '↓'} {btcChangeNum >= 0 ? '+' : ''}{btcChange}%
              </span>
            </div>
            
            {/* ETH Card */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '32px',
                borderRadius: '16px',
                backgroundColor: 'rgba(98, 126, 234, 0.1)',
                border: '1px solid rgba(98, 126, 234, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px' }}>Ξ</span>
                <span style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 600 }}>Ethereum</span>
              </div>
              <span style={{ color: '#f1f5f9', fontSize: '42px', fontWeight: 700 }}>
                {ethPrice}
              </span>
              <span
                style={{
                  color: ethChangeNum >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: '24px',
                  fontWeight: 600,
                  marginTop: '8px',
                }}
              >
                {ethChangeNum >= 0 ? '↑' : '↓'} {ethChangeNum >= 0 ? '+' : ''}{ethChange}%
              </span>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ color: '#64748b', fontSize: '18px' }}>
              Real-time crypto market data
            </span>
            <span style={{ color: '#64748b', fontSize: '18px' }}>
              cryptocurrency.cv
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
