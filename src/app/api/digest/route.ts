import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, NewsArticle } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured, GroqAuthError, parseGroqJson } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';
import { aiComplete, getAIConfigOrNull, AIAuthError } from '@/lib/ai-provider';

export const runtime = 'edge';
export const revalidate = 300; // 5 minute cache

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DigestSection {
  title: string;
  summary: string;
  articles: string[];
}

interface DigestResponse {
  headline: string;
  tldr: string;
  marketSentiment: {
    overall: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    reasoning: string;
  };
  sections: DigestSection[];
  mustRead: {
    title: string;
    source: string;
    why: string;
  }[];
  tickers: {
    symbol: string;
    mentions: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }[];
}

export interface AiDigestSection {
  tag: string;
  headline: string;
  summary: string;
  article_count: number;
  top_articles: { title: string; url: string }[];
}

export interface AiDigestResponse {
  date: string;
  sections: AiDigestSection[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Tag inference — keyword → canonical tag
// ---------------------------------------------------------------------------

const TAG_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'taproot', 'ordinals', 'runes'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'eip', 'erc-20', 'erc20', 'layer2', 'layer 2', 'l2', 'blob', 'dencun', 'pectra', 'optimism', 'arbitrum', 'base'],
  defi: ['defi', 'decentralized finance', 'dex', 'uniswap', 'aave', 'compound', 'yield', 'liquidity', 'staking', 'lending', 'amm', 'swap', 'vault', 'protocol'],
  nft: ['nft', 'non-fungible', 'opensea', 'blur', 'collection', 'mint', 'floor price', 'jpeg', 'digital art'],
  regulation: ['regulation', 'sec', 'cftc', 'fca', 'government', 'law', 'bill', 'legislation', 'compliance', 'lawsuit', 'court', 'enforcement', 'ban', 'cbdc', 'policy'],
  solana: ['solana', 'sol', 'svm', 'pyth', 'jupiter', 'serum', 'raydium', 'phantom', 'drift'],
  altcoins: ['xrp', 'ripple', 'cardano', 'ada', 'polkadot', 'dot', 'chainlink', 'link', 'matic', 'polygon', 'avax', 'avalanche', 'bnb', 'binance', 'ton', 'tron', 'sui', 'aptos'],
  market: ['market', 'price', 'rally', 'bull', 'bear', 'dump', 'pump', 'ath', 'all-time high', 'correction', 'volatility', 'futures', 'options', 'etf', 'fund', 'institutional'],
};

function inferTag(article: NewsArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return tag;
  }
  // Fall back to the article's own category
  return article.category?.toLowerCase() || 'general';
}

// ---------------------------------------------------------------------------
// In-memory cache for ai-digest results (key = YYYY-MM-DD ISO date)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: AiDigestResponse;
  expiresAt: number;
}

const digestCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// AI-digest builder
// ---------------------------------------------------------------------------

const GROUP_SUMMARY_SYSTEM = `You are a concise crypto news editor. Given a list of news article headlines and descriptions on a specific topic, write a 2-3 sentence summary that captures the key developments. Be factual and direct. Do NOT use bullet points. Return only the summary text.`;

async function buildAiDigest(articles: NewsArticle[]): Promise<AiDigestResponse> {
  const today = new Date().toISOString().slice(0, 10);

  // Check cache
  const cached = digestCache.get(today);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Group articles by tag
  const groups = new Map<string, NewsArticle[]>();
  for (const article of articles) {
    const tag = inferTag(article);
    const bucket = groups.get(tag) ?? [];
    bucket.push(article);
    groups.set(tag, bucket);
  }

  // Sort groups by size descending, keep groups with ≥2 articles
  const qualifiedGroups = [...groups.entries()]
    .filter(([, arts]) => arts.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const hasAI = getAIConfigOrNull(true) !== null;

  const sections: AiDigestSection[] = await Promise.all(
    qualifiedGroups.map(async ([tag, arts]) => {
      const top = arts.slice(0, 5);
      const topArticles = top.map(a => ({ title: a.title, url: a.link }));
      const headline = top[0].title;

      let summary = top.map(a => a.description ?? a.title).join(' ').slice(0, 400);

      if (hasAI) {
        try {
          const articlesList = top
            .map(a => `- ${a.title}: ${a.description ?? ''}`)
            .join('\n');
          summary = await aiComplete(
            GROUP_SUMMARY_SYSTEM,
            `Topic: ${tag}\n\nArticles:\n${articlesList}`,
            { maxTokens: 200, temperature: 0.4, jsonMode: false },
            true // prefer Groq for speed
          );
        } catch {
          // keep the fallback summary
        }
      }

      return {
        tag,
        headline,
        summary: summary.trim(),
        article_count: arts.length,
        top_articles: topArticles.slice(0, 3),
      };
    })
  );

  const result: AiDigestResponse = {
    date: today,
    sections,
    generated_at: new Date().toISOString(),
  };

  digestCache.set(today, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// ---------------------------------------------------------------------------
// HTML renderer
// ---------------------------------------------------------------------------

function renderDigestHtml(digest: AiDigestResponse): string {
  const sectionHtml = digest.sections
    .map(
      s => `
  <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:16px;">
    <span style="background:#6c63ff;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${s.tag}</span>
    <h2 style="color:#e0e0e0;font-size:16px;margin:12px 0 8px;">${s.headline}</h2>
    <p style="color:#a0a0b0;font-size:14px;line-height:1.6;margin:0 0 12px;">${s.summary}</p>
    <p style="color:#6c63ff;font-size:12px;margin:0 0 8px;">${s.article_count} articles</p>
    <ul style="padding-left:16px;margin:0;">
      ${s.top_articles.map(a => `<li style="margin-bottom:6px;"><a href="${a.url}" style="color:#7c8cf8;text-decoration:none;font-size:13px;">${a.title}</a></li>`).join('')}
    </ul>
  </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Crypto Daily Digest — ${digest.date}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <h1 style="color:#fff;font-size:24px;margin:0 0 4px;">🗞 Crypto Daily Digest</h1>
    <p style="color:#6c63ff;font-size:13px;margin:0 0 24px;">${digest.date} · ${digest.sections.length} topics</p>
    ${sectionHtml}
    <div style="text-align:center;margin-top:32px;">
      <a href="/newsletter" style="background:#6c63ff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Subscribe for daily email</a>
    </div>
    <p style="color:#444;font-size:11px;text-align:center;margin-top:24px;">Generated at ${digest.generated_at}</p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Original Groq-based full/brief/newsletter prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a crypto news editor creating a daily digest. Analyze the provided articles and create a structured summary.

Create a digest with:
1. headline: A catchy headline summarizing the day's biggest story
2. tldr: 2-3 sentence summary of what happened today
3. marketSentiment: Overall market mood with reasoning
4. sections: Group related news into 3-5 themed sections (e.g., "Bitcoin & ETFs", "DeFi Updates", "Regulatory News")
5. mustRead: Top 2-3 must-read articles with reasons why they matter
6. tickers: Most mentioned cryptocurrencies with sentiment

Respond with valid JSON matching this structure.`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '24h'; // 24h, 12h, 6h
  const format = searchParams.get('format') || 'full'; // full, brief, newsletter, ai-digest, html

  // --- New: ai-digest / html formats ---
  if (format === 'ai-digest' || format === 'html') {
    try {
      const hours = 24;
      const data = await getLatestNews(50);
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recent = data.articles.filter(a => new Date(a.pubDate) >= cutoff);
      const articlesForDigest = recent.length >= 5 ? recent : data.articles.slice(0, 50);

      const digest = await buildAiDigest(articlesForDigest);

      if (format === 'html') {
        const html = renderDigestHtml(digest);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return NextResponse.json(digest, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('AI digest error:', error);

      // If all AI providers failed with auth errors, return 503
      if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable',
            details: 'All configured AI providers failed authentication. Please check API keys.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate AI digest', details: String(error) },
        { status: 500 }
      );
    }
  }

  // --- Original Groq-based formats ---
  // Check if any AI provider is available (Groq or fallback)
  const hasAnyAI = getAIConfigOrNull(true) !== null;
  if (!isGroqConfigured() && !hasAnyAI) return groqNotConfiguredResponse();

  try {
    // Fetch articles based on period
    const hoursMap: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24 };
    const hours = hoursMap[period] || 24;
    const limit = Math.min(hours * 5, 100); // ~5 articles per hour
    
    const data = await getLatestNews(limit);
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        error: 'No articles available for digest',
      }, { status: 404 });
    }

    // Filter to articles within the time period
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentArticles = data.articles.filter(a => {
      const pubDate = new Date(a.pubDate);
      return pubDate >= cutoff;
    });

    const articlesForDigest = recentArticles.length > 0 ? recentArticles : data.articles.slice(0, 20);

    const articlesText = articlesForDigest
      .map(a => `- [${a.source}] ${a.title}: ${a.description || 'No description'}`)
      .join('\n');

    const formatInstructions = {
      full: 'Create a comprehensive digest with all sections.',
      brief: 'Create a brief digest with just headline, tldr, and top 3 tickers.',
      newsletter: 'Format for email newsletter - make it engaging and readable.',
    }[format] || 'Create a comprehensive digest with all sections.';

    const userPrompt = `${formatInstructions}

Period: Last ${hours} hours
Total articles: ${articlesForDigest.length}

Articles:
${articlesText}`;

    let digest: DigestResponse;
    try {
      // Try Groq first if configured
      if (isGroqConfigured()) {
        digest = await promptGroqJson<DigestResponse>(
          SYSTEM_PROMPT,
          userPrompt,
          { maxTokens: 3000, temperature: 0.5 }
        );
      } else {
        throw new GroqAuthError('Groq not configured, falling back to other providers');
      }
    } catch (groqError) {
      // On Groq auth failure, fall back to aiComplete (tries all providers)
      if (groqError instanceof GroqAuthError || (groqError as Error).name === 'GroqAuthError') {
        console.warn('Groq auth failed for digest, falling back to aiComplete:', (groqError as Error).message);
        const systemWithJson = SYSTEM_PROMPT + '\n\nAlways respond with valid JSON only, no markdown.';
        const raw = await aiComplete(systemWithJson, userPrompt, { maxTokens: 3000, temperature: 0.5, jsonMode: true }, false);
        digest = parseGroqJson<DigestResponse>(raw);
      } else {
        throw groqError;
      }
    }

    return NextResponse.json(
      {
        digest,
        meta: {
          period,
          format,
          articlesAnalyzed: articlesForDigest.length,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Digest error:', error);

    // If all AI providers failed with auth errors, return 503
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable',
          details: 'All configured AI providers failed authentication. Please check API keys.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate digest', details: String(error) },
      { status: 500 }
    );
  }
}
