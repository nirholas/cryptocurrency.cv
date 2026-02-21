import { ImageResponse } from 'next/og';
import { getCoinDetails, formatPrice, formatPercent } from '@/lib/market-data';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ coinId: string; locale: string }>;
}

export default async function Image({ params }: Props) {
  const { coinId } = await params;

  let name = coinId;
  let symbol = '';
  let priceStr = '$—';
  let changeStr = '0.00%';
  let changePositive = true;
  let iconUrl: string | null = null;

  try {
    const coinData = (await getCoinDetails(coinId)) as any;
    if (coinData) {
      name = coinData.name || coinId;
      symbol = (coinData.symbol || '').toUpperCase();
      const price: number = coinData.market_data?.current_price?.usd || 0;
      const change: number = Number(coinData.market_data?.price_change_percentage_24h) || 0;
      priceStr = formatPrice(price);
      changeStr = formatPercent(change);
      changePositive = change >= 0;
      iconUrl = coinData.image?.large || coinData.image?.small || null;
    }
  } catch {
    // Fall back to defaults
  }

  const accentColor = changePositive ? '#22c55e' : '#ef4444';

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
          <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', display: 'flex' }}>
            <span style={{ color: '#F7931A' }}>F</span>
            <span style={{ color: '#94a3b8' }}>CN</span>
          </span>
        </div>

        {/* Center section: coin info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flex: 1, paddingTop: '40px' }}>
          {/* Coin icon */}
          {iconUrl && (
            <img
              src={iconUrl}
              width={100}
              height={100}
              style={{ borderRadius: '50%' }}
              alt={name}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Name + symbol */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ color: '#ffffff', fontSize: '56px', fontWeight: 700, lineHeight: 1.1 }}>
                {name}
              </span>
              {symbol && (
                <span style={{ color: '#94a3b8', fontSize: '30px', fontWeight: 400 }}>
                  {symbol}
                </span>
              )}
            </div>

            {/* Price */}
            <span style={{ color: '#ffffff', fontSize: '48px', fontWeight: 700 }}>
              {priceStr}
            </span>

            {/* 24h change badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: changePositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${accentColor}`,
                borderRadius: '8px',
                padding: '8px 16px',
                width: 'fit-content',
              }}
            >
              <span style={{ color: accentColor, fontSize: '24px', fontWeight: 600 }}>
                {changePositive ? '▲' : '▼'} {changeStr} (24h)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ color: '#475569', fontSize: '16px' }}>cryptocurrency.cv</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
