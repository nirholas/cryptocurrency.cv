/**
 * Dynamic OG Image Generator
 * Generates social share images for articles
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const sourceColors: Record<string, string> = {
  'CoinDesk': '#1d4ed8',
  'The Block': '#7c3aed',
  'Decrypt': '#059669',
  'CoinTelegraph': '#d97706',
  'Bitcoin Magazine': '#b45309',
  'Blockworks': '#4f46e5',
  'The Defiant': '#db2777',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const title = searchParams.get('title') || 'Free Crypto News';
  const source = searchParams.get('source') || '';
  const date = searchParams.get('date') || '';
  
  const sourceColor = sourceColors[source] || '#64748b';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          padding: '60px',
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
            background: 'radial-gradient(circle at 20% 20%, rgba(247, 147, 26, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
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
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
          
          {/* Source badge */}
          {source && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  backgroundColor: sourceColor,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {source}
              </span>
              {date && (
                <span style={{ color: '#64748b', marginLeft: '16px', fontSize: '18px' }}>
                  {date}
                </span>
              )}
            </div>
          )}
          
          {/* Title */}
          <h1
            style={{
              color: '#f1f5f9',
              fontSize: title.length > 80 ? '42px' : '52px',
              fontWeight: 700,
              lineHeight: 1.2,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {title}
          </h1>
          
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '20px' }}>
              free-crypto-news.vercel.app
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#22c55e', fontSize: '18px' }}>● LIVE</span>
              <span style={{ color: '#64748b', fontSize: '18px' }}>7 Sources</span>
            </div>
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
