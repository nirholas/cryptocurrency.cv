/**
 * AI Blog Post Generator
 *
 * POST /api/ai/blog-generator
 *
 * Clusters the past 7 days of crypto news by topic and generates
 * SEO-optimised Markdown blog posts ready for content/blog/.
 *
 * Query params:
 *   ?topics=3          How many topic clusters to generate posts for (default 3, max 5)
 *   ?commit=true       Commit generated posts to GitHub via GITHUB_TOKEN
 *   ?days=7            Look-back window in days (default 7, max 30)
 *
 * Requires GROQ_API_KEY.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { callGroq, isGroqConfigured } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 120;

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  filename: string;   // e.g. "bitcoin-sec-etf-approval-2026-02-21.md"
  topic: string;
  frontmatter: string;
  body: string;
  full: string;       // frontmatter + body as a single string
  articleCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '');
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Commit a file to the GitHub repo via the Contents API.
 */
async function commitFileToGitHub(
  path: string,
  content: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { success: false, message: 'GITHUB_TOKEN not set' };

  const owner = 'nirholas';
  const repo = 'free-crypto-news';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Check if file already exists (get its SHA)
  let existingSha: string | undefined;
  try {
    const check = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (check.ok) {
      const data = await check.json();
      existingSha = data.sha;
    }
  } catch { /* file doesn't exist yet — that's fine */ }

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch: 'main',
  };
  if (existingSha) body.sha = existingSha;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, message: `GitHub error: ${err}` };
  }
  return { success: true, message: `Committed ${path}` };
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1 — Cluster headlines into topics
// ──────────────────────────────────────────────────────────────────────────────

async function clusterTopics(
  headlines: string[],
  numTopics: number
): Promise<Array<{ topic: string; headline_indices: number[]; keywords: string[] }>> {
  const list = headlines.map((h, i) => `${i}: ${h}`).join('\n');

  const response = await callGroq(
    [
      {
        role: 'system',
        content:
          'You are a crypto news editor. Identify the most newsworthy recurring themes in a list of headlines.',
      },
      {
        role: 'user',
        content: `Below are ${headlines.length} crypto news headlines from the past week. 
Group them into exactly ${numTopics} distinct topic clusters.

For each cluster return:
- "topic": short human-readable topic name (5-8 words)
- "headline_indices": array of headline index numbers that belong to this cluster
- "keywords": 5-8 SEO keywords related to this topic

Return ONLY a valid JSON array of ${numTopics} objects. No markdown.

Headlines:
${list}`,
      },
    ],
    { maxTokens: 2048, temperature: 0.2, jsonMode: true }
  );

  const parsed = JSON.parse(response.content.trim());
  return Array.isArray(parsed) ? parsed : parsed.clusters || parsed.topics || [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2 — Generate a full blog post for a topic cluster
// ──────────────────────────────────────────────────────────────────────────────

async function generatePost(
  topic: string,
  headlines: string[],
  keywords: string[],
  postDate: string
): Promise<GeneratedPost> {
  const headlineList = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `You are a professional crypto journalist writing a 1000-word SEO blog post.
Write in clear, factual, engaging prose. Use markdown headings. Avoid hype/shilling language.
Be technically accurate. Include actionable insights for crypto investors.`,
      },
      {
        role: 'user',
        content: `Write a 1000-word SEO-optimised crypto blog post covering the topic: "${topic}"

Base the post on these recent news headlines:
${headlineList}

Target SEO keywords: ${keywords.join(', ')}
Publication date: ${postDate}

The post structure MUST be:
1. Introduction (why this matters right now)
2. What Happened (factual summary of events)
3. Market Impact (price/sentiment implications)
4. What's Next (outlook and things to watch)
5. Key Takeaways (3-4 bullet points)

Return ONLY valid JSON with two fields:
- "title": the post title (compelling, SEO-friendly, max 70 chars)
- "body": the complete markdown body (no frontmatter, just H2-level headings and paragraphs)
- "description": meta description for SEO (max 160 chars)
- "tags": array of 5 tags (lowercase, no spaces)`,
      },
    ],
    { maxTokens: 3000, temperature: 0.4, jsonMode: true }
  );

  const data = JSON.parse(response.content.trim());

  const title: string = data.title || topic;
  const body: string = data.body || '';
  const description: string = data.description || `Latest crypto news on ${topic}.`;
  const tags: string[] = data.tags || keywords.slice(0, 5);

  const filename = `${slugify(title)}-${postDate}.md`;

  const frontmatter = `---
title: "${title.replace(/"/g, "'")}"
description: "${description.replace(/"/g, "'")}"
date: "${postDate}"
author: ai
category: weekly-roundup
tags: [${tags.map(t => `"${t}"`).join(', ')}]
generated: true
---
`;

  return {
    filename,
    topic,
    frontmatter,
    body,
    full: frontmatter + '\n' + body,
    articleCount: headlines.length,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is required for blog generation' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const numTopics = Math.min(parseInt(searchParams.get('topics') || '3', 10), 5);
  const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 30);
  const shouldCommit = searchParams.get('commit') === 'true';

  const postDate = today();

  // Fetch recent news
  const { articles } = await getLatestNews(200);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recent = articles.filter(a => new Date(a.pubDate) >= cutoff);

  if (recent.length < 5) {
    return NextResponse.json(
      { error: 'Not enough recent articles to generate posts', count: recent.length },
      { status: 422 }
    );
  }

  const headlines = recent.map(a => a.title);

  // Cluster into topics
  const clusters = await clusterTopics(headlines, numTopics);

  // Generate a post for each cluster
  const posts: GeneratedPost[] = [];
  const commitResults: Array<{ file: string; result: { success: boolean; message: string } }> = [];

  for (const cluster of clusters.slice(0, numTopics)) {
    const clusterHeadlines = (cluster.headline_indices || [])
      .map((i: number) => headlines[i])
      .filter(Boolean)
      .slice(0, 20);

    const post = await generatePost(
      cluster.topic,
      clusterHeadlines,
      cluster.keywords || [],
      postDate
    );
    posts.push(post);

    if (shouldCommit) {
      const result = await commitFileToGitHub(
        `content/blog/${post.filename}`,
        post.full,
        `📝 AI blog post: ${post.topic} — ${postDate}`
      );
      commitResults.push({ file: post.filename, result });
    }
  }

  return NextResponse.json({
    success: true,
    generated: posts.length,
    date: postDate,
    articlesAnalysed: recent.length,
    posts: posts.map(p => ({
      filename: p.filename,
      topic: p.topic,
      articleCount: p.articleCount,
      preview: p.full.slice(0, 400) + '…',
      content: p.full,
    })),
    ...(shouldCommit ? { commits: commitResults } : {}),
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/ai/blog-generator',
    description: 'Generate SEO blog posts from the past week of crypto news using AI',
    params: {
      topics: 'Number of topic clusters to write posts for (default 3, max 5)',
      days: 'Look-back window in days (default 7, max 30)',
      commit: 'Pass commit=true to commit posts to GitHub (requires GITHUB_TOKEN)',
    },
    requires: ['GROQ_API_KEY'],
    optional: ['GITHUB_TOKEN (for auto-commit to content/blog/)'],
    example: 'POST /api/ai/blog-generator?topics=3&days=7&commit=true',
  });
}
