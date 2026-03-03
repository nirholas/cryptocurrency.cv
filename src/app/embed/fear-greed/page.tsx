"use client";

import { useEffect, useState, useRef } from "react";

const BASE_URL = "https://cryptocurrency.cv";

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

function getLabel(value: number): string {
  const zone = ZONES.find((z) => value >= z.start && value <= z.end);
  return zone?.label ?? "Neutral";
}

export default function FearGreedWidget() {
  const [value, setValue] = useState(50);
  const [label, setLabel] = useState("Neutral");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showTitle, setShowTitle] = useState(true);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || "dark";
    setTheme(t === "light" ? "light" : "dark");
    setShowTitle(params.get("title") !== "false");
  }, []);

  useEffect(() => {
    async function fetchFearGreed() {
      try {
        const res = await fetch(`${BASE_URL}/api/fear-greed`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const v = data.value ?? data.data?.value ?? 50;
        const l = data.label ?? data.data?.label ?? getLabel(v);
        setValue(v);
        setLabel(l);
      } catch {
        setValue(50);
        setLabel("Neutral");
      } finally {
        setLoading(false);
      }
    }
    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 300000);
    return () => clearInterval(interval);
  }, []);

  // Animate gauge
  useEffect(() => {
    if (loading) return;
    const duration = 1200;
    const start = performance.now();
    const target = Math.max(0, Math.min(100, value));

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, loading]);

  const isDark = theme === "dark";
  const bg = isDark ? "#0f172a" : "#ffffff";
  const cardBg = isDark ? "#1e293b" : "#f8fafc";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const mutedText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const accentBlue = "#3b82f6";

  const gaugeColor = getColor(animatedValue);
  const radius = 80;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100;
  const startAngle = -180;
  const endAngle = 0;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + (animatedValue / 100) * totalAngle;
  const needleLength = radius - strokeWidth - 8;

  // Arc path for gauge
  function describeArc(startDeg: number, endDeg: number, r: number): string {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div
      style={{
        background: bg,
        padding: 20,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 320,
        textAlign: "center",
      }}
    >
      {showTitle && (
        <h2
          style={{
            color: text,
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Fear &amp; Greed Index
        </h2>
      )}

      {loading ? (
        <div
          style={{
            width: 200,
            height: 120,
            margin: "0 auto",
            background: cardBg,
            borderRadius: 12,
            animation: "pulse 1.5s infinite",
          }}
        >
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      ) : (
        <>
          <svg
            width="200"
            height="120"
            viewBox="0 100 200 120"
            style={{ margin: "0 auto", display: "block" }}
          >
            {/* Background arc segments */}
            {ZONES.map((zone) => (
              <path
                key={zone.label}
                d={describeArc(
                  startAngle + (zone.start / 100) * totalAngle,
                  startAngle + (zone.end / 100) * totalAngle,
                  radius,
                )}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.25}
              />
            ))}

            {/* Active arc */}
            <path
              d={describeArc(startAngle, currentAngle, radius)}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + needleLength * Math.cos((currentAngle * Math.PI) / 180)}
              y2={cy + needleLength * Math.sin((currentAngle * Math.PI) / 180)}
              stroke={gaugeColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={5} fill={gaugeColor} />
          </svg>

          <div style={{ marginTop: 8 }}>
            <div style={{ color: gaugeColor, fontSize: 36, fontWeight: 800 }}>
              {Math.round(animatedValue)}
            </div>
            <div
              style={{
                color: gaugeColor,
                fontSize: 14,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {label}
            </div>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 8,
          borderTop: `1px solid ${border}`,
        }}
      >
        <a
          href={`${BASE_URL}/en/fear-greed`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: mutedText, fontSize: 11, textDecoration: "none" }}
        >
          Powered by{" "}
          <span style={{ color: accentBlue, fontWeight: 600 }}>
            Crypto Vision News
          </span>
        </a>
      </div>
    </div>
  );
}
