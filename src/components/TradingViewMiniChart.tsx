/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface TradingViewMiniChartProps {
  symbol?: string;
  width?: string | number;
  height?: number;
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M' | 'ALL';
  className?: string;
  colorTheme?: 'dark' | 'light';
  trendLineColor?: string;
  underLineColor?: string;
}

export default function TradingViewMiniChart({
  symbol = 'BINANCE:BTCUSDT',
  width = '100%',
  height = 220,
  dateRange = '1M',
  className,
  colorTheme,
  trendLineColor = 'rgba(41, 98, 255, 1)',
  underLineColor = 'rgba(41, 98, 255, 0.07)',
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme =
    colorTheme || (resolvedTheme === 'dark' || resolvedTheme === 'midnight' ? 'dark' : 'light');

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.appendChild(innerDiv);

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: typeof width === 'number' ? width : '100%',
      height,
      locale: 'en',
      dateRange,
      colorTheme: theme,
      trendLineColor,
      underLineColor,
      underLineBottomColor: 'rgba(41, 98, 255, 0)',
      isTransparent: true,
      autosize: typeof width !== 'number',
      largeChartUrl: '',
      noTimeScale: false,
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);
  }, [symbol, width, height, dateRange, theme, trendLineColor, underLineColor]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden rounded-xl border border-border bg-(--color-surface)', className)}
      style={{ width: typeof width === 'number' ? width : '100%' }}
    />
  );
}
