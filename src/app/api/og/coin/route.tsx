/**
 * Dynamic OG Image Generator for Coin Pages
 * Generates social share images with coin data for viral sharing
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const name = searchParams.get('name') || 'Bitcoin';
  const symbol = searchParams.get('symbol') || 'BTC';
  const price = searchParams.get('price') || '$0.00';
  const change = searchParams.get('change') || '0';
  const changeNum = parseFloat(change);
  const isPositive = changeNum >= 0;
  
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
            background: isPositive 
              ? 'radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
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
                {symbol.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flex: 1 }}>
            <span style={{ color: '#f1f5f9', fontSize: '72px', fontWeight: 700 }}>
              {price}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <span style={{ fontSize: '32px' }}>
                {isPositive ? '📈' : '📉'}
              </span>
              <span
                style={{
                  color: isPositive ? '#22c55e' : '#ef4444',
                  fontSize: '32px',
                  fontWeight: 700,
                }}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
            </div>
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
