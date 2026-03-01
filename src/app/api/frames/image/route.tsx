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
 * 🖼️ Farcaster Frame Image Generator
 * 
 * Generates dynamic OG images for frames.
 */

import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'news';
  
  let data: any = {};
  try {
    data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  } catch {
    // Invalid or malformed `data` query param — fall back to empty object
  }
  
  // News image
  if (type === 'news') {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            padding: '40px',
            fontFamily: 'system-ui',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}>
              Free Crypto News
            </div>
            <div style={{ color: '#64748b', fontSize: '20px' }}>
              {data.index || 1}/{data.total || 5}
            </div>
          </div>
          
          {/* Title */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: data.title?.length > 80 ? '32px' : '40px',
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 1.3,
              padding: '0 20px',
            }}
          >
            {data.title || 'Latest Crypto News'}
          </div>
          
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '18px' }}>
            <div>📡 {data.source || 'Multiple Sources'}</div>
            <div>🕐 {data.timeAgo || 'Just now'}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
  
  // Sentiment image
  if (type === 'sentiment') {
    const value = data.value || 50;
    const classification = data.classification || 'Neutral';
    const color = value < 30 ? '#ef4444' : value < 50 ? '#f97316' : value < 70 ? '#22c55e' : '#3b82f6';
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            padding: '40px',
            fontFamily: 'system-ui',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '24px', marginBottom: '20px' }}>
            😱 Fear & Greed Index
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
            <div style={{ color, fontSize: '120px', fontWeight: 'bold' }}>
              {value}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '32px', marginLeft: '10px' }}>
              /100
            </div>
          </div>
          
          <div style={{ color, fontSize: '36px', fontWeight: 'bold' }}>
            {classification}
          </div>
          
          {/* Gauge bar */}
          <div
            style={{
              display: 'flex',
              width: '80%',
              height: '20px',
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              marginTop: '30px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${value}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '10px',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', marginTop: '10px', color: '#64748b', fontSize: '16px' }}>
            <span>Extreme Fear</span>
            <span>Extreme Greed</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
  
  // Vote result image
  if (type === 'vote-result') {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            padding: '40px',
            fontFamily: 'system-ui',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>
            {data.vote === 'bullish' ? '🐂' : '🐻'}
          </div>
          
          <div style={{ color: data.vote === 'bullish' ? '#22c55e' : '#ef4444', fontSize: '48px', fontWeight: 'bold' }}>
            Vote Recorded!
          </div>
          
          <div style={{ color: '#94a3b8', fontSize: '24px', marginTop: '20px' }}>
            You voted {data.vote === 'bullish' ? 'Bullish 📈' : 'Bearish 📉'}
          </div>
          
          <div style={{ color: '#64748b', fontSize: '20px', marginTop: '30px' }}>
            Total votes: {data.total?.toLocaleString() || '1,234'}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
  
  // Trending image
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          padding: '40px',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', color: '#f97316', fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>
          🔥 Trending in Crypto
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {(data.topics || ['Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Regulation']).map((topic: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', color: 'white', fontSize: '28px' }}>
              <span style={{ color: '#f97316', marginRight: '15px' }}>#{i + 1}</span>
              {topic}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
