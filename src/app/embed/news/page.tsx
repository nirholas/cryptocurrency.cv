/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category?: string;
  image?: string;
}

const BASE_URL = "https://cryptocurrency.cv";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function _escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [count, setCount] = useState(10);
  const [showTitle, setShowTitle] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || "dark";
    setTheme(t === "light" ? "light" : "dark");
    setCount(parseInt(params.get("count") || "10", 10));
    setShowTitle(params.get("title") !== "false");
  }, []);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`${BASE_URL}/api/news?limit=${count}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNews(
          Array.isArray(data)
            ? data.slice(0, count)
            : (data.articles || data.data || []).slice(0, count),
        );
      } catch {
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [count]);

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
        minHeight: "100%",
        maxWidth: 600,
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
            📰 Crypto News
          </h2>
          <span style={{ color: mutedText, fontSize: 11 }}>Live</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                borderRadius: 8,
                padding: 12,
                height: 72,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      ) : news.length === 0 ? (
        <p style={{ color: mutedText, textAlign: "center", padding: 24 }}>
          No news available
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {news.map((item, i) => (
            <a
              key={item.id || i}
              href={item.url || `${BASE_URL}/en/article/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: cardBg,
                borderRadius: 8,
                padding: 12,
                textDecoration: "none",
                border: `1px solid ${border}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = cardHover)
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = cardBg)}
            >
              <div
                style={{
                  color: text,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  marginBottom: 6,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: mutedText,
                }}
              >
                <span>{item.source}</span>
                <span>·</span>
                <span>{timeAgo(item.publishedAt)}</span>
                {item.category && (
                  <>
                    <span>·</span>
                    <span
                      style={{
                        background: isDark ? "#1e3a5f" : "#dbeafe",
                        color: isDark ? "#60a5fa" : "#2563eb",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </>
                )}
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
