/**
 * AI Podcast Generator
 *
 * Generates audio news briefings using:
 * 1. AI summarization (multi-provider) to create a podcast script
 * 2. Google Cloud Text-to-Speech to render it as audio
 *
 * Supports multiple formats:
 * - Flash Brief (2-3 min) — Top headlines
 * - Deep Dive (10-15 min) — Full market analysis
 * - Market Open (5 min) — Pre-market briefing
 * - Weekly Recap (15-20 min) — Week in review
 *
 * @module lib/ai-podcast
 */

import { aiComplete, getAIConfigOrNull } from './ai-provider';
import { getLatestNews } from './crypto-news';
import { buildMarketSnapshot, type MarketSnapshot } from './ai-commentary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PodcastFormat = 'flash' | 'deep-dive' | 'market-open' | 'weekly-recap';
export type VoiceGender = 'male' | 'female' | 'neutral';
export type VoiceStyle = 'news' | 'conversational' | 'dramatic';

export interface PodcastSegment {
  type: 'intro' | 'headline' | 'analysis' | 'market-data' | 'transition' | 'outro';
  text: string;
  ssml?: string;
  speaker: string;
  durationEstimate: number; // seconds
}

export interface PodcastScript {
  title: string;
  description: string;
  format: PodcastFormat;
  segments: PodcastSegment[];
  totalDuration: number;
  generatedAt: string;
  snapshot: MarketSnapshot;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  format: PodcastFormat;
  script: PodcastScript;
  audioUrl?: string;
  audioBase64?: string;
  mimeType: string;
  duration: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Script Generation
// ---------------------------------------------------------------------------

const FORMAT_CONFIG: Record<PodcastFormat, { maxSegments: number; targetDuration: number; description: string }> = {
  flash: { maxSegments: 8, targetDuration: 180, description: '2-3 minute flash briefing' },
  'deep-dive': { maxSegments: 20, targetDuration: 900, description: '10-15 minute deep analysis' },
  'market-open': { maxSegments: 12, targetDuration: 300, description: '5 minute pre-market briefing' },
  'weekly-recap': { maxSegments: 25, targetDuration: 1200, description: '15-20 minute weekly review' },
};

function buildScriptPrompt(
  snapshot: MarketSnapshot,
  format: PodcastFormat,
  headlines: { title: string; source: string; timeAgo: string }[]
): { system: string; user: string } {
  const config = FORMAT_CONFIG[format];

  const system = `You are an AI podcast script writer for a crypto news show called "Crypto Pulse".
Write a professional ${config.description} podcast script.

OUTPUT FORMAT: JSON object with these fields:
{
  "title": "Episode title (catchy, descriptive)",
  "description": "1-2 sentence episode description for podcast feeds",
  "segments": [
    {
      "type": "intro" | "headline" | "analysis" | "market-data" | "transition" | "outro",
      "text": "The spoken text (natural conversational English, written for audio)",
      "speaker": "host" or "analyst",
      "durationEstimate": estimated_seconds
    }
  ]
}

WRITING RULES:
- Write for the EAR, not the eye. Use conversational language.
- Numbers: say "ninety-seven thousand" not "$97,000" (but include both for context)
- Percentages: "up about two and a half percent" 
- Use natural transitions: "Now let's look at...", "Moving on to...", "Here's where it gets interesting..."
- Start with a compelling hook, end with a forward-looking statement
- Max ${config.maxSegments} segments, target ${config.targetDuration} seconds total
- Include at least one "analysis" segment connecting multiple data points
- Reference specific headlines and data — don't be vague
- Each segment should be 15-90 seconds when spoken
- ALWAYS include intro and outro segments

RESPOND ONLY WITH VALID JSON — no markdown, no explanation.`;

  const user = `Generate a "${format}" podcast script using this live data:

MARKET DATA:
- Bitcoin: $${snapshot.btcPrice.toLocaleString()} (${snapshot.btcChange24h > 0 ? '+' : ''}${snapshot.btcChange24h.toFixed(2)}% 24h)
- Ethereum: $${snapshot.ethPrice.toLocaleString()} (${snapshot.ethChange24h > 0 ? '+' : ''}${snapshot.ethChange24h.toFixed(2)}% 24h)
- Total Market Cap: $${(snapshot.totalMarketCap / 1e12).toFixed(2)} trillion (${snapshot.marketCapChange24h > 0 ? '+' : ''}${snapshot.marketCapChange24h.toFixed(2)}%)
- BTC Dominance: ${snapshot.dominanceBtc.toFixed(1)}%
- Fear & Greed Index: ${snapshot.fearGreed}/100 (${snapshot.fearGreedLabel})

TOP MOVERS:
${snapshot.topMovers.map(m => `  ${m.symbol}: ${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`).join('\n')}

LATEST HEADLINES:
${headlines.map((h, i) => `  ${i + 1}. [${h.source}] ${h.title} (${h.timeAgo})`).join('\n')}

Generate the podcast script now.`;

  return { system, user };
}

export async function generatePodcastScript(
  format: PodcastFormat = 'flash'
): Promise<PodcastScript> {
  const [snapshot, newsResult] = await Promise.all([
    buildMarketSnapshot(),
    getLatestNews(20).catch(() => ({ articles: [] })),
  ]);

  const headlines = newsResult.articles.slice(0, 15).map(a => ({
    title: a.title,
    source: a.source,
    timeAgo: a.timeAgo,
  }));

  const config = getAIConfigOrNull();
  if (!config) {
    return createFallbackScript(format, snapshot, headlines);
  }

  const { system, user } = buildScriptPrompt(snapshot, format, headlines);

  try {
    const raw = await aiComplete(system, user, {
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw);
    const segments: PodcastSegment[] = (parsed.segments || []).map((s: Record<string, unknown>) => ({
      type: s.type || 'headline',
      text: s.text || '',
      speaker: s.speaker || 'host',
      durationEstimate: typeof s.durationEstimate === 'number' ? s.durationEstimate : 30,
    }));

    const totalDuration = segments.reduce((sum, s) => sum + s.durationEstimate, 0);

    return {
      title: parsed.title || `Crypto Pulse ${format} Brief`,
      description: parsed.description || `AI-generated ${format} crypto news briefing`,
      format,
      segments,
      totalDuration,
      generatedAt: new Date().toISOString(),
      snapshot,
    };
  } catch (error) {
    console.error('[Podcast] Script generation failed:', error);
    return createFallbackScript(format, snapshot, headlines);
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech via Google Cloud
// ---------------------------------------------------------------------------

interface TTSOptions {
  voiceGender?: VoiceGender;
  voiceStyle?: VoiceStyle;
  speakingRate?: number;
  pitch?: number;
}

/**
 * Converts text to speech using Google Cloud TTS API.
 * Requires GOOGLE_CLOUD_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<{ audioBase64: string; mimeType: string }> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Google Cloud TTS not configured. Set GOOGLE_CLOUD_TTS_API_KEY.');
  }

  const { voiceGender = 'neutral', speakingRate = 1.0, pitch = 0 } = options;

  // Select voice: Neural2 voices for highest quality
  const voiceMap: Record<VoiceGender, string> = {
    male: 'en-US-Neural2-D',
    female: 'en-US-Neural2-F',
    neutral: 'en-US-Neural2-J',
  };

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: voiceMap[voiceGender],
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
          effectsProfileId: ['headphone-class-device'],
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google TTS error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return {
    audioBase64: data.audioContent,
    mimeType: 'audio/mpeg',
  };
}

/**
 * Generates a complete podcast episode: script + audio.
 */
export async function generatePodcastEpisode(
  format: PodcastFormat = 'flash',
  ttsOptions: TTSOptions = {}
): Promise<PodcastEpisode> {
  // Step 1: Generate the script
  const script = await generatePodcastScript(format);

  // Step 2: Combine segments into full text for TTS
  const fullText = script.segments.map(s => s.text).join('\n\n');

  // Step 3: Generate audio
  let audioBase64: string | undefined;
  let mimeType = 'audio/mpeg';

  try {
    const tts = await textToSpeech(fullText, ttsOptions);
    audioBase64 = tts.audioBase64;
    mimeType = tts.mimeType;
  } catch (error) {
    console.warn('[Podcast] TTS failed, returning script only:', error);
  }

  return {
    id: `podcast-${format}-${Date.now()}`,
    title: script.title,
    description: script.description,
    format,
    script,
    audioBase64,
    mimeType,
    duration: script.totalDuration,
    generatedAt: script.generatedAt,
  };
}

// ---------------------------------------------------------------------------
// RSS Feed Generation (for podcast apps)
// ---------------------------------------------------------------------------

export function generatePodcastRSS(
  episodes: PodcastEpisode[],
  baseUrl: string
): string {
  const now = new Date().toUTCString();

  const items = episodes
    .filter(ep => ep.audioUrl)
    .map(
      ep => `
    <item>
      <title><![CDATA[${ep.title}]]></title>
      <description><![CDATA[${ep.description}]]></description>
      <pubDate>${new Date(ep.generatedAt).toUTCString()}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      <enclosure url="${ep.audioUrl}" length="0" type="${ep.mimeType}" />
      <itunes:duration>${ep.duration}</itunes:duration>
      <itunes:episode>${ep.id}</itunes:episode>
      <itunes:explicit>false</itunes:explicit>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Crypto Pulse — AI News Briefing</title>
  <link>${baseUrl}</link>
  <description>AI-generated crypto news podcast powered by free-crypto-news</description>
  <language>en-us</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${baseUrl}/api/podcast/feed" rel="self" type="application/rss+xml" />
  <itunes:author>Crypto Pulse AI</itunes:author>
  <itunes:category text="Business">
    <itunes:category text="Investing" />
  </itunes:category>
  <itunes:explicit>false</itunes:explicit>
  <itunes:image href="${baseUrl}/icons/podcast-cover.svg" />
  <itunes:owner>
    <itunes:name>free-crypto-news</itunes:name>
    <itunes:email>podcast@cryptocurrency.cv</itunes:email>
  </itunes:owner>
  ${items}
</channel>
</rss>`;
}

// ---------------------------------------------------------------------------
// Fallback Script (no AI provider)
// ---------------------------------------------------------------------------

function createFallbackScript(
  format: PodcastFormat,
  snapshot: MarketSnapshot,
  headlines: { title: string; source: string; timeAgo: string }[]
): PodcastScript {
  const segments: PodcastSegment[] = [
    {
      type: 'intro',
      text: `Welcome to Crypto Pulse, your AI-powered crypto news briefing. Here's what's happening in the markets right now.`,
      speaker: 'host',
      durationEstimate: 10,
    },
    {
      type: 'market-data',
      text: `Bitcoin is trading at ${snapshot.btcPrice.toLocaleString()} dollars, ${snapshot.btcChange24h > 0 ? 'up' : 'down'} ${Math.abs(snapshot.btcChange24h).toFixed(1)} percent in the last 24 hours. Ethereum sits at ${snapshot.ethPrice.toLocaleString()} dollars, ${snapshot.ethChange24h > 0 ? 'up' : 'down'} ${Math.abs(snapshot.ethChange24h).toFixed(1)} percent. The Fear and Greed Index is at ${snapshot.fearGreed} out of 100, indicating ${snapshot.fearGreedLabel} sentiment.`,
      speaker: 'host',
      durationEstimate: 25,
    },
    ...headlines.slice(0, 4).map((h, i) => ({
      type: 'headline' as const,
      text: `${i === 0 ? 'In our top story' : 'Also making headlines'}: ${h.title}. That's according to ${h.source}, reported ${h.timeAgo}.`,
      speaker: 'host',
      durationEstimate: 15,
    })),
    {
      type: 'outro',
      text: `That's your Crypto Pulse briefing. This is AI-generated content and is not financial advice. Always do your own research. We'll be back with another update soon.`,
      speaker: 'host',
      durationEstimate: 12,
    },
  ];

  return {
    title: `Crypto Pulse ${format === 'flash' ? 'Flash' : format === 'deep-dive' ? 'Deep Dive' : format === 'market-open' ? 'Market Open' : 'Weekly Recap'}`,
    description: `AI-generated ${format} briefing`,
    format,
    segments,
    totalDuration: segments.reduce((s, seg) => s + seg.durationEstimate, 0),
    generatedAt: new Date().toISOString(),
    snapshot,
  };
}
