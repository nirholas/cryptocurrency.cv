'use client';

interface UsageChartProps {
  data: { date: string; requests: number }[];
  height?: number;
  showLabels?: boolean;
  title?: string;
}

export function UsageChart({
  data,
  height = 200,
  showLabels = true,
  title = 'API Usage Over Time',
}: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-neutral-500">
          No usage data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.requests), 1);
  const padding = 40;
  const chartWidth = 100; // percentage
  const barWidth = (chartWidth - 10) / data.length;

  // Calculate nice Y-axis ticks
  const getYAxisTicks = (max: number): number[] => {
    if (max <= 10) return [0, 5, 10];
    if (max <= 100) return [0, 25, 50, 75, 100];
    if (max <= 1000) return [0, 250, 500, 750, 1000];
    const step = Math.ceil(max / 4 / 100) * 100;
    return [0, step, step * 2, step * 3, step * 4];
  };

  const yTicks = getYAxisTicks(maxValue);
  const yMax = yTicks[yTicks.length - 1];

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-neutral-400">
          Total: {formatNumber(data.reduce((sum, d) => sum + d.requests, 0))} requests
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        {showLabels && (
          <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-neutral-500">
            {yTicks.reverse().map((tick, i) => (
              <span key={i} className="text-right pr-2">
                {formatNumber(tick)}
              </span>
            ))}
          </div>
        )}

        {/* Chart area */}
        <div
          className="absolute right-0 top-0 bottom-6"
          style={{ left: showLabels ? '48px' : '0' }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full">
            {yTicks.reverse().map((_, i) => {
              const y = (i / (yTicks.length - 1)) * 100;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={`${y}%`}
                  x2="100%"
                  y2={`${y}%`}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-0.5 pb-1">
            {data.map((item, i) => {
              const barHeight = yMax > 0 ? (item.requests / yMax) * 100 : 0;
              const isToday = i === data.length - 1;

              return (
                <div key={i} className="flex-1 group relative" style={{ height: '100%' }}>
                  {/* Bar */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-200 ${
                      isToday
                        ? 'bg-gray-400 hover:bg-gray-300'
                        : 'bg-gray-400/60 hover:bg-gray-400/80'
                    }`}
                    style={{
                      height: `${Math.max(barHeight, 1)}%`,
                      minHeight: item.requests > 0 ? '4px' : '0',
                    }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm whitespace-nowrap shadow-lg">
                      <div className="font-medium">{formatDate(item.date)}</div>
                      <div className="text-gray-300">{formatNumber(item.requests)} requests</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        {showLabels && (
          <div
            className="absolute bottom-0 h-6 flex justify-between text-xs text-neutral-500"
            style={{ left: showLabels ? '48px' : '0', right: '0' }}
          >
            {data
              .filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1)
              .map((item, i) => (
                <span key={i}>{formatDate(item.date)}</span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini sparkline version for table cells
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 80, height = 24, color = '#a3a3a3' }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-neutral-800 rounded" />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Area fill */}
      <polygon points={areaPoints} fill={`${color}20`} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Tier distribution pie chart
interface TierDistributionProps {
  free: number;
  pro: number;
  enterprise: number;
}

export function TierDistribution({ free, pro, enterprise }: TierDistributionProps) {
  const total = free + pro + enterprise;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-neutral-500">No API keys yet</div>
    );
  }

  const freePercent = (free / total) * 100;
  const proPercent = (pro / total) * 100;
  const enterprisePercent = (enterprise / total) * 100;

  // Calculate stroke dash array for donut chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const freeLength = (freePercent / 100) * circumference;
  const proLength = (proPercent / 100) * circumference;
  const enterpriseLength = (enterprisePercent / 100) * circumference;

  return (
    <div className="flex items-center gap-8">
      {/* Donut chart */}
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="16"
          strokeDasharray={`${freeLength} ${circumference}`}
          strokeDashoffset="0"
          transform="rotate(-90 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="16"
          strokeDasharray={`${proLength} ${circumference}`}
          strokeDashoffset={-freeLength}
          transform="rotate(-90 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#a855f7"
          strokeWidth="16"
          strokeDasharray={`${enterpriseLength} ${circumference}`}
          strokeDashoffset={-(freeLength + proLength)}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-white"
        >
          {total}
        </text>
        <text
          x="60"
          y="75"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-neutral-400"
        >
          total
        </text>
      </svg>

      {/* Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm">
            Free: {free} ({freePercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm">
            Pro: {pro} ({proPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm">
            Enterprise: {enterprise} ({enterprisePercent.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
