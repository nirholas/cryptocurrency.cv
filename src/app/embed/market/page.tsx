/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState } from "react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image?: string;
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

export default function MarketWidget() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showTitle, setShowTitle] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || "dark";
    setTheme(t === "light" ? "light" : "dark");
    setShowTitle(params.get("title") !== "false");
  }, []);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch(`${BASE_URL}/api/prices?limit=5`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCoins(
          Array.isArray(data)
            ? data.slice(0, 5)
            : (data.data || data.prices || []).slice(0, 5),
        );
      } catch {
        setCoins([
          {
            id: "bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            current_price: 97500,
            price_change_percentage_24h: 2.4,
            market_cap: 1.92e12,
          },
          {
            id: "ethereum",
            symbol: "ETH",
            name: "Ethereum",
            current_price: 3400,
            price_change_percentage_24h: -1.2,
            market_cap: 4.08e11,
          },
          {
            id: "solana",
            symbol: "SOL",
            name: "Solana",
            current_price: 195,
            price_change_percentage_24h: 5.1,
            market_cap: 9.4e10,
          },
          {
            id: "binancecoin",
            symbol: "BNB",
            name: "BNB",
            current_price: 680,
            price_change_percentage_24h: 0.8,
            market_cap: 9.9e10,
          },
          {
            id: "cardano",
            symbol: "ADA",
            name: "Cardano",
            current_price: 1.05,
            price_change_percentage_24h: -2.3,
            market_cap: 3.7e10,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === "dark";
  const bg = isDark ? "#0f172a" : "#ffffff";
  const cardBg = isDark ? "#1e293b" : "#f8fafc";
  const cardHover = isDark ? "#334155" : "#f1f5f9";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const mutedText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const accentBlue = "#3b82f6";

  return (
    <div
      style={{
        background: bg,
        padding: 16,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 420,
      }}
    >
      {showTitle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <h2 style={{ color: text, fontSize: 16, fontWeight: 700, margin: 0 }}>
            📊 Market Overview
          </h2>
          <span style={{ color: mutedText, fontSize: 11 }}>Top 5</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                borderRadius: 8,
                padding: 12,
                height: 52,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr 1fr 80px 80px",
              gap: 8,
              padding: "0 8px 6px",
              borderBottom: `1px solid ${border}`,
            }}
          >
            <span style={{ color: mutedText, fontSize: 10, fontWeight: 600 }}>
              #
            </span>
            <span style={{ color: mutedText, fontSize: 10, fontWeight: 600 }}>
              Name
            </span>
            <span
              style={{
                color: mutedText,
                fontSize: 10,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              Price
            </span>
            <span
              style={{
                color: mutedText,
                fontSize: 10,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              24h
            </span>
            <span
              style={{
                color: mutedText,
                fontSize: 10,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              MCap
            </span>
          </div>

          {coins.map((coin, i) => (
            <a
              key={coin.id}
              href={`${BASE_URL}/en/coin/${coin.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr 1fr 80px 80px",
                gap: 8,
                alignItems: "center",
                padding: "8px",
                borderRadius: 8,
                textDecoration: "none",
                background: cardBg,
                border: `1px solid ${border}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = cardHover)
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = cardBg)}
            >
              <span style={{ color: mutedText, fontSize: 12, fontWeight: 600 }}>
                {i + 1}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {coin.image && (
                  <img
                    src={coin.image}
                    alt={coin.name}
                    width={20}
                    height={20}
                    style={{ borderRadius: "50%" }}
                  />
                )}
                <div>
                  <div style={{ color: text, fontSize: 13, fontWeight: 600 }}>
                    {coin.name}
                  </div>
                  <div
                    style={{
                      color: mutedText,
                      fontSize: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    {coin.symbol}
                  </div>
                </div>
              </div>
              <div
                style={{
                  color: text,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {formatPrice(coin.current_price)}
              </div>
              <div
                style={{
                  textAlign: "right",
                  color:
                    coin.price_change_percentage_24h >= 0
                      ? "#16c784"
                      : "#ea3943",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                {coin.price_change_percentage_24h.toFixed(2)}%
              </div>
              <div
                style={{ color: mutedText, fontSize: 12, textAlign: "right" }}
              >
                {formatCompact(coin.market_cap)}
              </div>
            </a>
          ))}
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          paddingTop: 8,
          borderTop: `1px solid ${border}`,
        }}
      >
        <a
          href={BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: mutedText, fontSize: 11, textDecoration: "none" }}
        >
          Powered by{" "}
          <span style={{ color: accentBlue, fontWeight: 600 }}>
            Crypto Vision
          </span>
        </a>
      </div>
    </div>
  );
}
