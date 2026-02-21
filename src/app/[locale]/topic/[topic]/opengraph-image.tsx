import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ topic: string; locale: string }>;
}

export default async function Image({ params }: Props) {
  const { topic } = await params;

  const displayTopic = decodeURIComponent(topic);

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
        {/* Top bar: branding */}
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

        {/* Center: topic heading + subtitle */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <span
            style={{
              color: '#22c55e',
              fontSize: displayTopic.length > 20 ? '64px' : '80px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            #{displayTopic}
          </span>
          <span
            style={{
              color: '#94a3b8',
              fontSize: '28px',
              fontWeight: 400,
              letterSpacing: '0.05em',
            }}
          >
            Latest Crypto News
          </span>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800 }}>₿</span>
            </div>
            <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 600 }}>
              cryptocurrency.cv
            </span>
          </div>
          <span style={{ color: '#475569', fontSize: '16px' }}>No API key required</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
