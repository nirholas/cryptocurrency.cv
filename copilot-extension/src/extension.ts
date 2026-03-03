/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import * as vscode from 'vscode';

const API_BASE = 'https://cryptocurrency.cv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewsArticle {
  title: string;
  source: string;
  link: string;
  timeAgo: string;
  description?: string;
  sentiment?: string;
  category?: string;
  priority?: string;
}

interface PriceInfo {
  usd: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
}

interface GasPrice {
  slow: number;
  standard: number;
  fast: number;
  usdSlow?: number;
  usdStandard?: number;
  usdFast?: number;
}

interface FearGreedCurrent {
  value: number;
  valueClassification: string;
  timestamp?: number;
  timeUntilUpdate?: string;
}

interface FearGreedResponse {
  current: FearGreedCurrent;
  trend?: {
    direction: string;
    change7d: number;
    change30d: number;
    averageValue7d?: number;
    averageValue30d?: number;
  };
  breakdown?: Record<string, { value: number; weight: number }>;
  lastUpdated?: string;
}

interface FearGreedLegacy {
  value: number;
  classification: string;
  timestamp?: string;
  previous?: { value: number; classification: string };
}

interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
  relatedTerms?: string[];
}

interface SentimentArticle {
  title: string;
  link: string;
  source: string;
  sentiment: string;
  confidence: number;
  reasoning: string;
  impactLevel: string;
  timeHorizon: string;
  affectedAssets: string[];
}

interface MarketSentiment {
  overall: string;
  score: number;
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

interface SentimentResponse {
  articles: SentimentArticle[];
  market: MarketSentiment;
  distribution?: Record<string, number>;
  highImpactNews?: SentimentArticle[];
}

interface ExplainResponse {
  success: boolean;
  explanation?: {
    summary: string;
    background: string;
    whyTrending: string;
    marketImplications: string;
    outlook: string;
  };
  articleCount?: number;
  recentHeadlines?: string[];
  message?: string;
}

interface ResearchReport {
  summary: string;
  sentiment: string;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  outlook: string;
  priceData?: {
    price: number;
    change24h: number;
    change7d?: number;
  };
  marketCap?: number;
}

interface ResearchResponse {
  success: boolean;
  report?: ResearchReport;
  quickTake?: {
    take: string;
    sentiment: string;
    confidence: number;
  };
  articlesAnalyzed?: number;
  error?: string;
}

interface BreakingNewsResponse {
  articles: NewsArticle[];
  count?: number;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiBase(): string {
  const config = vscode.workspace.getConfiguration('crypto');
  return config.get<string>('apiUrl') || API_BASE;
}

async function fetchAPI<T = any>(endpoint: string, token?: vscode.CancellationToken): Promise<T> {
  const baseUrl = getApiBase();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  token?.onCancellationRequested(() => controller.abort());

  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function formatArticles(articles: NewsArticle[]): string {
  if (articles.length === 0) return '*No articles found.*';
  return articles
    .map((a, i) => {
      const sentiment =
        a.sentiment === 'bullish' ? '🟢' : a.sentiment === 'bearish' ? '🔴' : '⚪';
      const desc = a.description ? `\n   > ${a.description.slice(0, 120)}…` : '';
      return `${i + 1}. ${sentiment} **${a.title}**${desc}\n   📰 ${a.source} • ${a.timeAgo}\n   🔗 [Read more](${a.link})`;
    })
    .join('\n\n');
}

function fearGreedEmoji(value: number): string {
  if (value < 25) return '😱';
  if (value < 40) return '😨';
  if (value < 60) return '😐';
  if (value < 75) return '😀';
  return '🤑';
}

function fearGreedBar(value: number): string {
  const filled = Math.floor(value / 5);
  return `\`${'█'.repeat(filled)}${'░'.repeat(20 - filled)}\` ${value}/100`;
}

function sentimentEmoji(sentiment: string): string {
  switch (sentiment) {
    case 'very_bullish': return '🟢🟢';
    case 'bullish': return '🟢';
    case 'bearish': return '🔴';
    case 'very_bearish': return '🔴🔴';
    default: return '⚪';
  }
}

function sentimentLabel(sentiment: string): string {
  return sentiment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleNews(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  stream.markdown('📰 **Latest Crypto News**\n\n');
  stream.progress('Fetching latest news…');

  const data = await fetchAPI<{ articles: NewsArticle[] }>('/api/news?limit=10', token);
  const articles = data.articles || [];

  stream.markdown(formatArticles(articles));
  stream.markdown('\n\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'news' } };
}

async function handleBreaking(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  stream.markdown('🚨 **Breaking Crypto News**\n\n');
  stream.progress('Fetching breaking news…');

  const data = await fetchAPI<BreakingNewsResponse>('/api/breaking?limit=10', token);
  const articles = data.articles || [];

  if (articles.length === 0) {
    stream.markdown('*No breaking news right now. Check back soon!*\n');
    stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
    return { metadata: { command: 'breaking' } };
  }

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]!;
    const priority = a.priority === 'high' ? '🔴 HIGH' : a.priority === 'medium' ? '🟡 MED' : '';
    const badge = priority ? ` \`${priority}\`` : '';
    const sentimentIcon =
      a.sentiment === 'bullish' ? '🟢' : a.sentiment === 'bearish' ? '🔴' : '⚪';
    const desc = a.description ? `\n   > ${a.description.slice(0, 140)}` : '';

    stream.markdown(
      `${i + 1}. ${sentimentIcon}${badge} **${a.title}**${desc}\n   📰 ${a.source} • ${a.timeAgo}\n   🔗 [Read more](${a.link})\n\n`,
    );
  }

  if (data.updatedAt) {
    stream.markdown(`*Updated: ${data.updatedAt}*\n`);
  }

  stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'breaking' } };
}

async function handlePrice(
  query: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  const coin = query.trim().toLowerCase() || 'bitcoin';
  stream.markdown(`💰 **Price: ${coin.charAt(0).toUpperCase() + coin.slice(1)}**\n\n`);
  stream.progress(`Looking up ${coin} price…`);

  const data = await fetchAPI<{ prices: Record<string, PriceInfo> }>(
    `/api/prices?coin=${encodeURIComponent(coin)}`,
    token,
  );
  const prices = data.prices || {};

  if (Object.keys(prices).length === 0) {
    stream.markdown(`*Could not find price data for "${coin}".*`);
    return { metadata: { command: 'price' } };
  }

  stream.markdown('| Coin | Price | 24h Change | Market Cap | Volume (24h) |\n');
  stream.markdown('|------|-------|------------|------------|-------------|\n');

  for (const [symbol, info] of Object.entries(prices).slice(0, 10)) {
    const changeEmoji = info.change24h > 0 ? '📈' : info.change24h < 0 ? '📉' : '➡️';
    const cap = info.marketCap ? `$${(info.marketCap / 1e9).toFixed(2)}B` : '—';
    const vol = info.volume24h ? `$${(info.volume24h / 1e9).toFixed(2)}B` : '—';
    stream.markdown(
      `| ${symbol.toUpperCase()} | $${info.usd?.toLocaleString() ?? 'N/A'} | ${changeEmoji} ${info.change24h?.toFixed(2) ?? 0}% | ${cap} | ${vol} |\n`,
    );
  }

  stream.markdown('\n\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'price' } };
}

async function handleMarket(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  stream.markdown('📊 **Market Overview**\n\n');
  stream.progress('Loading market data…');

  const [sentimentData, priceData, fgData] = await Promise.all([
    fetchAPI<{ market: { score: number; label: string; bullish: number; bearish: number; neutral: number } }>(
      '/api/sentiment',
      token,
    ).catch(() => null),
    fetchAPI<{ prices: Record<string, PriceInfo> }>('/api/prices?limit=5', token),
    fetchAPI<FearGreedResponse>('/api/fear-greed', token).catch(() => null),
  ]);

  // --- Fear & Greed section ---
  if (fgData?.current) {
    const fgVal = fgData.current.value;
    const fgLabel = fgData.current.valueClassification || 'Unknown';
    stream.markdown(`### Fear & Greed Index\n\n`);
    stream.markdown(`${fearGreedEmoji(fgVal)} **${fgVal}** — ${fgLabel}\n\n`);
    stream.markdown(`${fearGreedBar(fgVal)}\n\n`);
    if (fgData.trend) {
      const dir = fgData.trend.direction === 'improving' ? '⬆️' : fgData.trend.direction === 'worsening' ? '⬇️' : '➡️';
      stream.markdown(`7d change: ${dir} ${fgData.trend.change7d > 0 ? '+' : ''}${fgData.trend.change7d} · 30d change: ${fgData.trend.change30d > 0 ? '+' : ''}${fgData.trend.change30d}\n\n`);
    }
  }

  // --- Sentiment section ---
  if (sentimentData?.market) {
    const market = sentimentData.market;
    const emoji = market.score > 60 ? '🟢' : market.score < 40 ? '🔴' : '🟡';

    stream.markdown(`### News Sentiment\n\n`);
    stream.markdown(`**Overall:** ${emoji} ${market.label} (${market.score}/100)\n\n`);
    stream.markdown(`- 🟢 Bullish: ${market.bullish}%\n`);
    stream.markdown(`- 🔴 Bearish: ${market.bearish}%\n`);
    stream.markdown(`- ⚪ Neutral: ${market.neutral}%\n\n`);
  }

  // --- Top coins section ---
  const prices = priceData.prices || {};
  if (Object.keys(prices).length > 0) {
    stream.markdown('### Top Coins\n\n');
    stream.markdown('| Coin | Price | 24h |\n|------|-------|-----|\n');
    for (const [symbol, info] of Object.entries(prices).slice(0, 5)) {
      const arrow = info.change24h > 0 ? '📈' : info.change24h < 0 ? '📉' : '➡️';
      stream.markdown(`| ${symbol.toUpperCase()} | $${info.usd?.toLocaleString() ?? 'N/A'} | ${arrow} ${info.change24h?.toFixed(2) ?? 0}% |\n`);
    }
  }

  stream.markdown('\n\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'market' } };
}

async function handleSentiment(
  query: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  const coin = query.trim().toUpperCase() || '';

  if (!coin) {
    stream.markdown('⚠️ Please provide a coin, e.g. `/sentiment BTC` or `/sentiment ethereum`');
    return { metadata: { command: 'sentiment' } };
  }

  stream.markdown(`🧠 **Sentiment Analysis: ${coin}**\n\n`);
  stream.progress(`Analyzing sentiment for ${coin}…`);

  const data = await fetchAPI<SentimentResponse>(
    `/api/sentiment?asset=${encodeURIComponent(coin)}&limit=20`,
    token,
  );

  // Market-level summary
  if (data.market) {
    const m = data.market;
    stream.markdown(`### Overall Market Mood\n\n`);
    stream.markdown(`${sentimentEmoji(m.overall)} **${sentimentLabel(m.overall)}** (score: ${m.score > 0 ? '+' : ''}${m.score}/100, confidence: ${m.confidence}%)\n\n`);
    stream.markdown(`> ${m.summary}\n\n`);

    if (m.keyDrivers && m.keyDrivers.length > 0) {
      stream.markdown('**Key Drivers:**\n');
      for (const driver of m.keyDrivers) {
        stream.markdown(`- ${driver}\n`);
      }
      stream.markdown('\n');
    }
  }

  // Distribution breakdown
  if (data.distribution) {
    const d = data.distribution;
    stream.markdown('### Sentiment Distribution\n\n');
    stream.markdown('| Sentiment | Count |\n|-----------|-------|\n');
    if (d.very_bullish) stream.markdown(`| 🟢🟢 Very Bullish | ${d.very_bullish} |\n`);
    if (d.bullish) stream.markdown(`| 🟢 Bullish | ${d.bullish} |\n`);
    if (d.neutral) stream.markdown(`| ⚪ Neutral | ${d.neutral} |\n`);
    if (d.bearish) stream.markdown(`| 🔴 Bearish | ${d.bearish} |\n`);
    if (d.very_bearish) stream.markdown(`| 🔴🔴 Very Bearish | ${d.very_bearish} |\n`);
    stream.markdown('\n');
  }

  // High-impact news
  const highImpact = data.highImpactNews || data.articles?.filter(a => a.impactLevel === 'high') || [];
  if (highImpact.length > 0) {
    stream.markdown('### High-Impact News\n\n');
    for (const article of highImpact.slice(0, 5)) {
      stream.markdown(
        `- ${sentimentEmoji(article.sentiment)} **${article.title}**\n  ${article.reasoning}\n  ⏱ ${article.timeHorizon} · Affects: ${article.affectedAssets.join(', ')}\n  🔗 [Read](${article.link})\n\n`,
      );
    }
  }

  // Remaining articles summary
  const remaining = (data.articles || []).filter(a => a.impactLevel !== 'high');
  if (remaining.length > 0) {
    stream.markdown(`### Other ${coin} News (${remaining.length} articles)\n\n`);
    for (const article of remaining.slice(0, 5)) {
      stream.markdown(
        `- ${sentimentEmoji(article.sentiment)} **${article.title}** — ${article.reasoning}\n`,
      );
    }
    if (remaining.length > 5) {
      stream.markdown(`\n*…and ${remaining.length - 5} more articles analyzed.*\n`);
    }
  }

  stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'sentiment' } };
}

async function handleSearch(
  query: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  if (!query) {
    stream.markdown('⚠️ Please provide a search term, e.g. `/search bitcoin ETF`');
    return { metadata: { command: 'search' } };
  }

  stream.markdown(`🔍 **Search: "${query}"**\n\n`);
  stream.progress(`Searching for "${query}"…`);

  const data = await fetchAPI<{ articles: NewsArticle[]; total?: number }>(
    `/api/news?search=${encodeURIComponent(query)}&limit=10`,
    token,
  );
  const articles = data.articles || [];

  if (articles.length === 0) {
    stream.markdown(`*No articles found for "${query}".*`);
  } else {
    stream.markdown(`Found **${data.total ?? articles.length}** results:\n\n`);
    stream.markdown(formatArticles(articles));
  }

  stream.markdown('\n\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'search' } };
}

async function handleGas(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  stream.markdown('⛽ **Ethereum Gas Prices**\n\n');
  stream.progress('Fetching gas prices…');

  const data = await fetchAPI<{ gas: GasPrice }>('/api/gas', token);
  const gas = data.gas || ({} as GasPrice);

  stream.markdown('| Speed | Gwei | Est. USD |\n');
  stream.markdown('|-------|------|----------|\n');
  stream.markdown(`| 🐢 Slow | ${gas.slow ?? '—'} gwei | ${gas.usdSlow ? '$' + gas.usdSlow.toFixed(2) : '—'} |\n`);
  stream.markdown(`| 🚶 Standard | ${gas.standard ?? '—'} gwei | ${gas.usdStandard ? '$' + gas.usdStandard.toFixed(2) : '—'} |\n`);
  stream.markdown(`| 🚀 Fast | ${gas.fast ?? '—'} gwei | ${gas.usdFast ? '$' + gas.usdFast.toFixed(2) : '—'} |\n`);

  stream.markdown('\n\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'gas' } };
}

async function handleFearGreed(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  stream.markdown('😱 **Fear & Greed Index**\n\n');
  stream.progress('Fetching index…');

  // Try the structured endpoint first
  try {
    const data = await fetchAPI<FearGreedResponse>('/api/fear-greed', token);

    if (data.current) {
      const value = data.current.value ?? 50;
      const label = data.current.valueClassification || 'Neutral';

      stream.markdown(`**Current:** ${fearGreedEmoji(value)} **${value}** — ${label}\n\n`);
      stream.markdown(`${fearGreedBar(value)}\n\n`);

      if (data.trend) {
        const dir = data.trend.direction === 'improving' ? '⬆️' : data.trend.direction === 'worsening' ? '⬇️' : '➡️';
        stream.markdown(`**Trend:** ${dir} ${data.trend.direction}\n`);
        stream.markdown(`- 7-day change: ${data.trend.change7d > 0 ? '+' : ''}${data.trend.change7d}\n`);
        stream.markdown(`- 30-day change: ${data.trend.change30d > 0 ? '+' : ''}${data.trend.change30d}\n\n`);
      }

      if (data.breakdown) {
        stream.markdown('### Breakdown\n\n');
        stream.markdown('| Factor | Value | Weight |\n|--------|-------|--------|\n');
        for (const [factor, info] of Object.entries(data.breakdown)) {
          const name = factor.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          stream.markdown(`| ${name} | ${info.value} | ${(info.weight * 100).toFixed(0)}% |\n`);
        }
        stream.markdown('\n');
      }

      stream.markdown(`*Updated: ${data.lastUpdated || 'Recently'}*\n`);
      stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
      return { metadata: { command: 'fear-greed' } };
    }
  } catch {
    // Fall through to legacy format
  }

  // Legacy fallback
  const data = await fetchAPI<FearGreedLegacy>('/api/fear-greed', token);
  const value = data.value ?? 50;
  const label = data.classification || 'Neutral';

  stream.markdown(`**Current:** ${fearGreedEmoji(value)} **${value}** — ${label}\n\n`);
  stream.markdown(`${fearGreedBar(value)}\n\n`);

  if (data.previous) {
    const prev = data.previous;
    const dir = prev.value < value ? '⬆️' : prev.value > value ? '⬇️' : '➡️';
    stream.markdown(`**Previous:** ${prev.value} — ${prev.classification} ${dir}\n\n`);
  }

  stream.markdown(`*Updated: ${data.timestamp || 'Recently'}*\n`);
  stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'fear-greed' } };
}

async function handleExplain(
  topic: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  if (!topic) {
    stream.markdown('⚠️ Please provide a topic to explain, e.g. `/explain Bitcoin` or `/explain DeFi`');
    return { metadata: { command: 'explain' } };
  }

  stream.markdown(`💡 **Why is "${topic}" Trending?**\n\n`);
  stream.progress(`Researching "${topic}"…`);

  // Try the AI trending-explainer endpoint first
  try {
    const data = await fetchAPI<ExplainResponse>(
      `/api/ai/explain?topic=${encodeURIComponent(topic)}&includePrice=true`,
      token,
    );

    if (data.success && data.explanation) {
      const ex = data.explanation;

      stream.markdown(`### Summary\n\n${ex.summary}\n\n`);

      if (ex.background) {
        stream.markdown(`### Background\n\n${ex.background}\n\n`);
      }

      if (ex.whyTrending) {
        stream.markdown(`### Why It's Trending\n\n${ex.whyTrending}\n\n`);
      }

      if (ex.marketImplications) {
        stream.markdown(`### Market Implications\n\n${ex.marketImplications}\n\n`);
      }

      if (ex.outlook) {
        stream.markdown(`### Outlook\n\n${ex.outlook}\n\n`);
      }

      if (data.recentHeadlines && data.recentHeadlines.length > 0) {
        stream.markdown('### Recent Headlines\n\n');
        for (const hl of data.recentHeadlines.slice(0, 5)) {
          stream.markdown(`- ${hl}\n`);
        }
        stream.markdown('\n');
      }

      if (data.articleCount) {
        stream.markdown(`*Based on ${data.articleCount} recent articles.*\n`);
      }

      stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
      return { metadata: { command: 'explain' } };
    }

    // AI endpoint returned no results — try glossary fallback
    if (data.message) {
      stream.markdown(`*${data.message}*\n\n`);
    }
  } catch {
    // AI explain endpoint unavailable, fall through to glossary
  }

  // Glossary fallback
  stream.progress(`Looking up "${topic}" in glossary…`);
  try {
    const glossary = await fetchAPI<{ term: GlossaryTerm }>(
      `/api/glossary?term=${encodeURIComponent(topic)}`,
      token,
    );

    if (glossary.term) {
      stream.markdown(`### 📖 ${glossary.term.term}\n\n`);
      stream.markdown(`${glossary.term.definition}\n\n`);
      if (glossary.term.category) {
        stream.markdown(`**Category:** ${glossary.term.category}\n\n`);
      }
      if (glossary.term.relatedTerms && glossary.term.relatedTerms.length > 0) {
        stream.markdown(`**Related:** ${glossary.term.relatedTerms.join(', ')}\n`);
      }
    } else {
      stream.markdown(`*No explanation or glossary entry found for "${topic}".*`);
    }
  } catch {
    stream.markdown(`*Could not find an explanation for "${topic}". Try a different topic.*`);
  }

  stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'explain' } };
}

async function handleResearch(
  topic: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  if (!topic) {
    stream.markdown('⚠️ Please provide a topic, e.g. `/research Bitcoin` or `/research Solana DeFi`');
    return { metadata: { command: 'research' } };
  }

  stream.markdown(`🔬 **Research Report: ${topic}**\n\n`);
  stream.progress(`Generating deep research on "${topic}"… (this may take a moment)`);

  const data = await fetchAPI<ResearchResponse>(
    `/api/ai/research?topic=${encodeURIComponent(topic)}`,
    token,
  );

  if (!data.success) {
    stream.markdown(`*${data.error || `Could not generate research for "${topic}".`}*\n`);
    stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
    return { metadata: { command: 'research' } };
  }

  const report = data.report;

  if (!report) {
    stream.markdown(`*No report data returned for "${topic}". Try a different query.*\n`);
    stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
    return { metadata: { command: 'research' } };
  }

  // Sentiment badge
  const badge = sentimentEmoji(report.sentiment);
  stream.markdown(`**Sentiment:** ${badge} ${sentimentLabel(report.sentiment)}\n\n`);

  // Price data if available
  if (report.priceData) {
    const p = report.priceData;
    const ch24 = p.change24h > 0 ? '📈' : p.change24h < 0 ? '📉' : '➡️';
    stream.markdown(`**Price:** $${p.price.toLocaleString()} ${ch24} ${p.change24h?.toFixed(2)}% (24h)`);
    if (p.change7d !== undefined) {
      stream.markdown(` · ${p.change7d?.toFixed(2)}% (7d)`);
    }
    stream.markdown('\n');
    if (report.marketCap) {
      stream.markdown(`**Market Cap:** $${(report.marketCap / 1e9).toFixed(2)}B\n`);
    }
    stream.markdown('\n');
  }

  // Summary
  stream.markdown(`### Executive Summary\n\n${report.summary}\n\n`);

  // Key findings
  if (report.keyFindings && report.keyFindings.length > 0) {
    stream.markdown('### Key Findings\n\n');
    for (const finding of report.keyFindings) {
      stream.markdown(`- ${finding}\n`);
    }
    stream.markdown('\n');
  }

  // Opportunities
  if (report.opportunities && report.opportunities.length > 0) {
    stream.markdown('### Opportunities\n\n');
    for (const opp of report.opportunities) {
      stream.markdown(`- 🟢 ${opp}\n`);
    }
    stream.markdown('\n');
  }

  // Risks
  if (report.risks && report.risks.length > 0) {
    stream.markdown('### Risks\n\n');
    for (const risk of report.risks) {
      stream.markdown(`- ⚠️ ${risk}\n`);
    }
    stream.markdown('\n');
  }

  // Outlook
  if (report.outlook) {
    stream.markdown(`### Outlook\n\n${report.outlook}\n\n`);
  }

  if (data.articlesAnalyzed) {
    stream.markdown(`*Based on analysis of ${data.articlesAnalyzed} recent articles.*\n`);
  }

  stream.markdown('\n---\n*Source: [cryptocurrency.cv](https://cryptocurrency.cv)*');
  return { metadata: { command: 'research' } };
}

// ---------------------------------------------------------------------------
// Chat participant
// ---------------------------------------------------------------------------

const chatHandler: vscode.ChatRequestHandler = async (
  request: vscode.ChatRequest,
  _context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
): Promise<vscode.ChatResult> => {
  const command = request.command;
  const query = request.prompt.trim();

  try {
    switch (command) {
      case 'breaking':
        return await handleBreaking(stream, token);
      case 'news':
        return await handleNews(stream, token);
      case 'price':
        return await handlePrice(query, stream, token);
      case 'market':
        return await handleMarket(stream, token);
      case 'sentiment':
        return await handleSentiment(query, stream, token);
      case 'search':
        return await handleSearch(query, stream, token);
      case 'gas':
        return await handleGas(stream, token);
      case 'fear-greed':
        return await handleFearGreed(stream, token);
      case 'explain':
        return await handleExplain(query, stream, token);
      case 'research':
        return await handleResearch(query, stream, token);
      default:
        // No command — treat prompt as a search if text is present
        if (query) {
          return await handleSearch(query, stream, token);
        }
        // Show help
        stream.markdown('👋 **Welcome to @crypto!**\n\n');
        stream.markdown('Available commands:\n\n');
        stream.markdown('| Command | Description |\n');
        stream.markdown('|---------|-------------|\n');
        stream.markdown('| `/breaking` | Latest breaking crypto news |\n');
        stream.markdown('| `/news` | Latest crypto news headlines |\n');
        stream.markdown('| `/price <coin>` | Current price (e.g. `/price bitcoin`) |\n');
        stream.markdown('| `/market` | Market overview with prices & Fear/Greed |\n');
        stream.markdown('| `/sentiment <coin>` | AI sentiment analysis (e.g. `/sentiment BTC`) |\n');
        stream.markdown('| `/search <query>` | Search news articles |\n');
        stream.markdown('| `/gas` | Ethereum gas prices |\n');
        stream.markdown('| `/fear-greed` | Fear & Greed Index |\n');
        stream.markdown('| `/explain <topic>` | Why is a topic trending? |\n');
        stream.markdown('| `/research <topic>` | Deep AI research report |\n');
        stream.markdown('\nOr just type a question and I\'ll search for relevant news.\n');
        return { metadata: { command: 'help' } };
    }
  } catch (error: any) {
    const message = error.name === 'AbortError'
      ? 'Request was cancelled.'
      : error.message || 'An unknown error occurred.';
    stream.markdown(`\n\n❌ **Error:** ${message}\n\nPlease try again later.`);
    return { metadata: { command: command ?? 'unknown', error: true } };
  }
};

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
  // Register @crypto chat participant
  const participant = vscode.chat.createChatParticipant('crypto-news.crypto', chatHandler);
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png');
  context.subscriptions.push(participant);

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('crypto.refresh', async () => {
      vscode.window.showInformationMessage('Crypto data refreshed!');
    }),
  );

  // Dashboard command
  context.subscriptions.push(
    vscode.commands.registerCommand('crypto.openDashboard', async () => {
      const panel = vscode.window.createWebviewPanel(
        'cryptoDashboard',
        'Crypto Dashboard',
        vscode.ViewColumn.One,
        { enableScripts: true },
      );
      panel.webview.html = getDashboardHTML();
    }),
  );

  console.log('Crypto News Copilot extension activated!');
}

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #fff; }
    h1 { color: #ffffff; }
    .card { background: #2d2d2d; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .bullish { color: #00ff88; }
    .bearish { color: #ff4444; }
    a { color: #58a6ff; }
    code { background: #3d3d3d; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>📰 Crypto Dashboard</h1>
  <div class="card">
    <p>Use <code>@crypto</code> in Copilot Chat to get started!</p>
    <p>Available commands:</p>
    <ul>
      <li><code>/breaking</code> — Breaking crypto news</li>
      <li><code>/news</code> — Latest crypto news</li>
      <li><code>/price &lt;coin&gt;</code> — Current price for a coin</li>
      <li><code>/market</code> — Market overview with prices &amp; Fear/Greed</li>
      <li><code>/sentiment &lt;coin&gt;</code> — AI sentiment analysis for a coin</li>
      <li><code>/search &lt;query&gt;</code> — Search news articles</li>
      <li><code>/gas</code> — Ethereum gas prices</li>
      <li><code>/fear-greed</code> — Fear &amp; Greed Index</li>
      <li><code>/explain &lt;topic&gt;</code> — Why is a topic trending?</li>
      <li><code>/research &lt;topic&gt;</code> — Deep AI research report</li>
    </ul>
  </div>
  <div class="card">
    <p>Powered by <a href="https://cryptocurrency.cv">Free Crypto News API</a></p>
  </div>
</body>
</html>`;
}

export function deactivate() {}
