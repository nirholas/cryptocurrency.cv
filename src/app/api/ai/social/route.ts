/**
 * Social Thread Generator
 *
 * POST /api/ai/social
 *
 * Turns any crypto article or topic into a ready-to-post Twitter thread
 * and a LinkedIn post.
 *
 * Body (JSON):
 *   { "url": "https://...",  // optional: fetch article from URL
 *     "title": "...",        // article headline
 *     "content": "..."  }    // article body / description (required if no url)
 *
 * Returns:
 *   { thread: string[], linkedin: string, hashtags: string[] }
 *
 * Requires GROQ_API_KEY.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGroq, isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface SocialBody {
  url?: string;
  title?: string;
  content?: string;
}

interface SocialOutput {
  thread: string[];            // each element is one tweet (max 280 chars)
  linkedin: string;            // full LinkedIn post
  hashtags: string[];          // suggested hashtags (no #)
  threadText: string;          // thread joined for easy copy-paste
  charCounts: number[];        // character count per tweet
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Lightweight fetch of article text from a URL (best-effort). */
async function fetchArticleText(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CryptoNewsBot/1.0 (https://cryptocurrency.cv)' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract visible text from <p> tags (crude but works for articles)
    const paragraphs = [...html.matchAll(/<p[^>]*>([^<]+(?:<[^/][^>]*>[^<]*<\/[^>]+>)*[^<]*)<\/p>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(p => p.length > 40)
      .slice(0, 20)
      .join('\n\n');

    return { title, content: paragraphs.slice(0, 3000) };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// AI generation
// ──────────────────────────────────────────────────────────────────────────────

async function generateSocialContent(
  title: string,
  content: string,
  sourceUrl?: string
): Promise<SocialOutput> {
  const articleContext = `Title: ${title}\n\nContent:\n${content.slice(0, 2500)}`;
  const sourceNote = sourceUrl ? `\nSource URL: ${sourceUrl}` : '';

  const response = await callGroq(
    [
      {
        role: 'system',
        content: `You are a crypto media expert who writes viral, engaging social media content.
You write Twitter threads that are punchy, factual, and share-worthy.
You write LinkedIn posts that are professional yet accessible.
Never use excessive emoji. Be specific with numbers and facts.`,
      },
      {
        role: 'user',
        content: `Create social media content for this crypto article:

${articleContext}${sourceNote}

Return ONLY valid JSON with these fields:
- "thread": array of 5-8 tweet strings. Each tweet MUST be under 270 characters (leave room for thread numbering). Tweet 1 is the hook. Last tweet is the call to action / link. Use 1-2 relevant emoji per tweet max.
- "linkedin": a 200-300 word LinkedIn post. Professional tone. Start with a hook. Include 3 key insights as bullet points. End with a question to drive engagement.
- "hashtags": array of 5-7 relevant hashtags WITHOUT the # symbol (e.g. ["Bitcoin", "Crypto", "DeFi"])

Important: each tweet in the "thread" array should be self-contained and flow naturally when read in sequence.`,
      },
    ],
    { maxTokens: 2000, temperature: 0.5, jsonMode: true }
  );

  const data = JSON.parse(response.content.trim());

  const rawThread: string[] = data.thread || [];

  // Enforce 280-char limit — truncate tweets that are too long
  const thread = rawThread.map((tweet, i) => {
    const prefix = `${i + 1}/${rawThread.length} `;
    const maxBody = 280 - prefix.length;
    const body = tweet.length > maxBody ? tweet.slice(0, maxBody - 1) + '…' : tweet;
    return prefix + body;
  });

  return {
    thread,
    linkedin: data.linkedin || '',
    hashtags: (data.hashtags || []).map((h: string) => h.replace(/^#/, '')),
    threadText: thread.join('\n\n'),
    charCounts: thread.map(t => t.length),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is required for social content generation' },
      { status: 503 }
    );
  }

  let body: SocialBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let title: string = body.title || '';
  let content: string = body.content || '';

  // If URL provided but no content, try to fetch the article
  if (body.url && !content) {
    const fetched = await fetchArticleText(body.url);
    if (fetched) {
      title = title || fetched.title;
      content = fetched.content;
    }
  }

  if (!content && !title) {
    return NextResponse.json(
      { error: 'Provide either "content" + "title", or a "url" to fetch' },
      { status: 400 }
    );
  }

  // Use title as fallback content if content is empty
  if (!content) content = title;

  const output = await generateSocialContent(title, content, body.url);

  return NextResponse.json({
    success: true,
    ...output,
    meta: {
      tweetCount: output.thread.length,
      linkedinLength: output.linkedin.length,
      allTweetsValid: output.charCounts.every(c => c <= 280),
    },
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/ai/social',
    description: 'Generate a Twitter thread and LinkedIn post from any crypto article',
    body: {
      url: 'string (optional) — URL of article to fetch and convert',
      title: 'string (optional) — article headline',
      content: 'string (optional) — article body/description',
    },
    notes: 'Provide either url, or title+content, or all three',
    requires: ['GROQ_API_KEY'],
    example: {
      url: 'https://cryptocurrency.cv/en/article/abc123',
      title: 'Bitcoin Hits New All-Time High',
    },
  });
}
