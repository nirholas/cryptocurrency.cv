"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FearGreedGaugeProps {
  value: number;
  label: string;
  previousValue?: number;
  className?: string;
}

const ZONES = [
  { start: 0, end: 25, color: "#ea3943", label: "Extreme Fear" },
  { start: 25, end: 45, color: "#ea8c00", label: "Fear" },
  { start: 45, end: 55, color: "#f5d100", label: "Neutral" },
  { start: 55, end: 75, color: "#16c784", label: "Greed" },
  { start: 75, end: 100, color: "#0d8a5e", label: "Extreme Greed" },
];

function getColor(value: number): string {
  const zone = ZONES.find((z) => value >= z.start && value <= z.end);
  return zone?.color ?? "#f5d100";
}

function getLabelColor(value: number): string {
  if (value <= 25) return "text-red-500";
  if (value <= 45) return "text-orange-500";
  if (value <= 55) return "text-yellow-500";
  if (value <= 75) return "text-green-500";
  return "text-emerald-600";
}

function getSignal(value: number): { text: string; description: string; emoji: string } {
  if (value <= 20) return { text: "Strong Buy Signal", description: "Historically, extreme fear has preceded market recoveries", emoji: "🟢" };
  if (value <= 35) return { text: "Buy Signal", description: "Fear levels suggest the market may be undervalued", emoji: "🟡" };
  if (value <= 55) return { text: "Neutral", description: "Market sentiment is balanced — no strong directional bias", emoji: "⚪" };
  if (value <= 75) return { text: "Caution", description: "Elevated greed can signal an overheated market", emoji: "🟠" };
  return { text: "Sell Signal", description: "Extreme greed historically precedes corrections", emoji: "🔴" };
}

export default function FearGreedGauge({
  value,
  label,
  previousValue,
  className,
}: FearGreedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [showPulse, setShowPulse] = useState(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    const target = Math.max(0, Math.min(100, value));

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
      setAnimatedValue(Math.max(0, Math.min(100, eased * target)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const radius = 100;
  const cx = 130;
  const cy = 125;
  const strokeWidth = 22;
  const tickRadius = radius + 16;

  function valueToAngle(v: number): number {
    return Math.PI - (v / 100) * Math.PI;
  }

  function polarToCartesian(angle: number, r: number = radius): { x: number; y: number } {
    return {
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    };
  }

  function arcPath(startVal: number, endVal: number): string {
    const startAngle = valueToAngle(startVal);
    const endAngle = valueToAngle(endVal);
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const needleAngle = valueToAngle(animatedValue);
  const needleLength = radius - 18;
  const needleTip = polarToCartesian(needleAngle, needleLength);
  const needleBase1 = polarToCartesian(needleAngle + Math.PI / 2, 4);
  const needleBase2 = polarToCartesian(needleAngle - Math.PI / 2, 4);

  const prevAngle = previousValue != null ? valueToAngle(previousValue) : null;
  const prevMarker = prevAngle != null ? polarToCartesian(prevAngle, radius + 6) : null;
  const valueDiff = previousValue != null ? value - previousValue : null;

  const signal = getSignal(value);
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 260 160"
        className="w-full max-w-md"
        role="img"
        aria-label={`Fear and Greed Index: ${Math.round(animatedValue)} - ${label}`}
      >
        <defs>
          <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {ticks.map((v) => {
          const angle = valueToAngle(v);
          const isMajor = v % 25 === 0;
          const innerR = radius - strokeWidth / 2 - (isMajor ? 6 : 3);
          const outerR = radius - strokeWidth / 2 - 1;
          const inner = polarToCartesian(angle, innerR);
          const outer = polarToCartesian(angle, outerR);
          return (
            <line
              key={v}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--color-text-secondary, #666)"
              strokeWidth={isMajor ? 1.5 : 0.5}
              opacity={isMajor ? 0.6 : 0.3}
            />
          );
        })}

        {ZONES.map((seg) => (
          <path
            key={seg.start}
            d={arcPath(seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.18}
          />
        ))}

        <g filter={showPulse ? "url(#gaugeGlow)" : undefined}>
          {animatedValue > 0 &&
            ZONES.map((seg) => {
              const segStart = seg.start;
              const segEnd = Math.min(seg.end, animatedValue);
              if (segStart >= animatedValue) return null;
              return (
                <path
                  key={`active-${seg.start}`}
                  d={arcPath(segStart, segEnd)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })}
        </g>

        {ZONES.map((zone) => {
          const midVal = (zone.start + zone.end) / 2;
          const labelAngle = valueToAngle(midVal);
          const pos = polarToCartesian(labelAngle, tickRadius);
          return (
            <text
              key={zone.label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6.5"
              fill="var(--color-text-secondary, #888)"
              fontWeight="500"
              className="select-none"
            >
              {zone.label}
            </text>
          );
        })}

        {prevMarker && (
          <g>
            <circle
              cx={prevMarker.x}
              cy={prevMarker.y}
              r={3}
              fill="none"
              stroke="var(--color-text-secondary, #888)"
              strokeWidth={1.5}
              strokeDasharray="2,1"
            />
            <title>Yesterday: {previousValue}</title>
          </g>
        )}

        <g filter="url(#needleShadow)">
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={getColor(animatedValue)}
          />
        </g>
        <circle cx={cx} cy={cy} r={7} fill={getColor(animatedValue)} />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-surface, #fff)" />

        <text x={cx - radius - 8} y={cy + 14} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-secondary, #888)">0</text>
        <text x={cx} y={cy - radius - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-secondary, #888)">50</text>
        <text x={cx + radius + 8} y={cy + 14} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-secondary, #888)">100</text>
      </svg>

      <div className="text-center -mt-6">
        <div
          className={cn("text-6xl font-bold tabular-nums transition-colors duration-500", showPulse && "animate-pulse")}
          style={{ color: getColor(animatedValue) }}
        >
          {Math.round(animatedValue)}
        </div>
        <div className={cn("text-xl font-semibold mt-1", getLabelColor(value))}>
          {label}
        </div>
        {valueDiff != null && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-sm">
            <span
              className={cn(
                "font-medium tabular-nums",
                valueDiff > 0 ? "text-green-500" : valueDiff < 0 ? "text-red-500" : "text-[var(--color-text-secondary)]"
              )}
            >
              {valueDiff > 0 ? "▲" : valueDiff < 0 ? "▼" : "—"}{" "}
              {Math.abs(valueDiff)} from yesterday
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
          <span>{signal.emoji}</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{signal.text}</span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 max-w-xs mx-auto">{signal.description}</p>
      </div>
    </div>
  );
}
