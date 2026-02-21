import { ImageResponse } from 'next/og';
import { getArticleById } from '@/lib/archive-v2';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;

  let title = 'Crypto News';
  let source = 'Free Crypto News';
  let pubDate = '';

  try {
    const article = await getArticleById(id);
    if (article) {
      title = article.title;
      source = article.source;
      const dateStr = article.pub_date || article.first_seen;
      if (dateStr) {
        pubDate = new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }
  } catch {
    // Fall back to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          backgroundColor: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: '18px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Free Crypto News
          </span>
        </div>

        {/* Article title */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '40px 0',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: title.length > 80 ? '36px' : title.length > 50 ? '44px' : '52px',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {title.length > 120 ? title.slice(0, 120) + '…' : title}
          </span>
        </div>

        {/* Bottom bar: source + date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                color: '#22c55e',
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              {source}
            </span>
          </div>
          {pubDate && (
            <span style={{ color: '#64748b', fontSize: '18px' }}>{pubDate}</span>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
