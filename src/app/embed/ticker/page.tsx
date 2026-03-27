/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState, useRef } from "react";

interface PriceItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
}

const BASE_URL = "https://cryptocurrency.cv";

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export default function TickerWidget() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || "dark";
    setTheme(t === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`${BASE_URL}/api/prices?limit=20`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPrices(Array.isArray(data) ? data : data.data || data.prices || []);
      } catch {
        // Fallback sample data
        setPrices([
          { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 97500, price_change_percentage_24h: 2.4 },
          { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3400, price_change_percentage_24h: -1.2 },
          { id: "solana", symbol: "SOL", name: "Solana", current_price: 195, price_change_percentage_24h: 5.1 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === "dark";
  const bg = isDark ? "#0f172a" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const mutedText = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1e293b" : "#e2e8f0";

  if (loading) {
    return (
      <div style={{ background: bg, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ width: 120, height: 20, background: isDark ? "#1e293b" : "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  const duplicated = [...prices, ...prices];

  return (
    <div style={{ background: bg, overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", borderBottom: `1px solid ${border}` }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "10px 0",
          animation: `tickerScroll ${prices.length * 3}s linear infinite`,
          width: "max-content",
        }}
      >
        {duplicated.map((coin, i) => (
          <a
            key={`${coin.id}-${i}`}
            href={`${BASE_URL}/en/coin/${coin.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", whiteSpace: "nowrap", padding: "0 4px" }}
          >
            {coin.image && (
              <img src={coin.image} alt={coin.name} width={18} height={18} style={{ borderRadius: "50%" }} />
            )}
            <span style={{ color: mutedText, fontSize: 13, fontWeight: 500, textTransform: "uppercase" }}>
              {coin.symbol}
            </span>
            <span style={{ color: text, fontSize: 13, fontWeight: 600 }}>
              {formatPrice(coin.current_price)}
            </span>
            <span style={{
              color: coin.price_change_percentage_24h >= 0 ? "#16c784" : "#ea3943",
              fontSize: 12,
              fontWeight: 600,
            }}>
              {coin.price_change_percentage_24h >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </span>
          </a>
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        div:hover > div { animation-play-state: paused !important; }
      `}</style>
    </div>
  );
}
