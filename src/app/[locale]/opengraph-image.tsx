/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Dynamic Open Graph image for locale pages (homepage, etc.)
 * Next.js file convention: automatically sets og:image meta tag.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Free Crypto News — Free Real-Time Crypto News API';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DARK_BG = '#0f172a';
const ACCENT_GRADIENT = 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)';

export default async function Image({ params }: { params: { locale: string } }) {
  const locale = (await params).locale || 'en';
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const titles: Record<string, string> = {
    en: 'Free Real-Time Crypto News API',
    es: 'API de Noticias Cripto en Tiempo Real',
    fr: 'API de News Crypto en Temps Réel',
    de: 'Echtzeit-Krypto-Nachrichten-API',
    ja: 'リアルタイム暗号通貨ニュースAPI',
    ko: '실시간 암호화폐 뉴스 API',
    'zh-CN': '实时加密货币新闻API',
    pt: 'API de Notícias Cripto em Tempo Real',
    ru: 'API Криптоновостей в Реальном Времени',
    ar: 'واجهة أخبار العملات المشفرة',
  };

  const subtitle = titles[locale] || titles.en;

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
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <span style={{ color: '#475569', fontSize: '14px' }}>{date}</span>
        </div>

        {/* Brand name */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <span
            style={{
              color: '#f8fafc',
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
            }}
          >
            Free Crypto News
          </span>

          <span
            style={{
              color: '#94a3b8',
              fontSize: '32px',
              fontWeight: 500,
              lineHeight: 1.3,
              maxWidth: '900px',
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          {['No API Key', '300+ Sources', 'Real-Time', 'AI Ready'].map((label) => (
            <div
              key={label}
              style={{
                backgroundColor: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '20px',
                padding: '8px 18px',
              }}
            >
              <span style={{ color: '#93c5fd', fontSize: '15px', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
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
