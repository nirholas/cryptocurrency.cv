"use client";

import { useEffect, useState } from "react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  image?: string;
  sparkline_in_7d?: { price: number[] };
}

const BASE_URL = "https://cryptocurrency.cv";

function formatPrice(price: number): string {
  if (price >= 1)
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function MiniSparkline({
  prices,
  color,
  width = 120,
  height = 40,
}: {
  prices: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function CoinWidget() {
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [coinId, setCoinId] = useState("bitcoin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || "dark";
    setTheme(t === "light" ? "light" : "dark");
    setCoinId(params.get("coin") || "bitcoin");
  }, []);

  useEffect(() => {
    async function fetchCoin() {
      try {
        const res = await fetch(`${BASE_URL}/api/prices/${coinId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCoin(data.data || data);
      } catch {
        setCoin({
          id: coinId,
          symbol: coinId.substring(0, 3).toUpperCase(),
          name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
          current_price: 0,
          price_change_percentage_24h: 0,
          market_cap: 0,
          total_volume: 0,
          high_24h: 0,
          low_24h: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCoin();
    const interval = setInterval(fetchCoin, 60000);
    return () => clearInterval(interval);
  }, [coinId]);

  const isDark = theme === "dark";
  const bg = isDark ? "#0f172a" : "#ffffff";
  const cardBg = isDark ? "#1e293b" : "#f8fafc";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const mutedText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const accentBlue = "#3b82f6";

  if (loading) {
    return (
      <div
        style={{
          background: bg,
          padding: 20,
          borderRadius: 12,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              width: 160,
              height: 24,
              background: cardBg,
              borderRadius: 6,
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              width: 200,
              height: 36,
              background: cardBg,
              borderRadius: 6,
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              width: "100%",
              height: 40,
              background: cardBg,
              borderRadius: 6,
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  if (!coin) return null;

  const changeColor =
    coin.price_change_percentage_24h >= 0 ? "#16c784" : "#ea3943";

  return (
    <div
      style={{
        background: bg,
        padding: 20,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 380,
      }}
    >
      <div
        style={{
          background: cardBg,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {coin.image && (
            <img
              src={coin.image}
              alt={coin.name}
              width={36}
              height={36}
              style={{ borderRadius: "50%" }}
            />
          )}
          <div>
            <div style={{ color: text, fontSize: 18, fontWeight: 700 }}>
              {coin.name}
            </div>
            <div
              style={{
                color: mutedText,
                fontSize: 13,
                textTransform: "uppercase",
              }}
            >
              {coin.symbol}
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              color: text,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            {formatPrice(coin.current_price)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <span
              style={{
                background:
                  coin.price_change_percentage_24h >= 0
                    ? "#16c78420"
                    : "#ea394320",
                color: changeColor,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {coin.price_change_percentage_24h >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </span>
            <span style={{ color: mutedText, fontSize: 12 }}>24h</span>
          </div>
        </div>

        {/* Sparkline */}
        {coin.sparkline_in_7d?.price && (
          <div style={{ marginBottom: 16 }}>
            <MiniSparkline
              prices={coin.sparkline_in_7d.price}
              color={changeColor}
              width={300}
              height={50}
            />
          </div>
        )}

        {/* Stats */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {[
            { label: "Market Cap", value: formatCompact(coin.market_cap) },
            { label: "Volume 24h", value: formatCompact(coin.total_volume) },
            { label: "High 24h", value: formatPrice(coin.high_24h) },
            { label: "Low 24h", value: formatPrice(coin.low_24h) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: 8,
                background: isDark ? "#0f172a" : "#ffffff",
                borderRadius: 6,
                border: `1px solid ${border}`,
              }}
            >
              <div style={{ color: mutedText, fontSize: 11, marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ color: text, fontSize: 13, fontWeight: 600 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <a
          href={`${BASE_URL}/en/coin/${coin.id}`}
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
