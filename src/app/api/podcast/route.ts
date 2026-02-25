/**
 * AI Podcast API
 *
 * Generates AI-narrated crypto news podcasts.
 *
 * GET /api/podcast
 *   ?format=flash|deep-dive|market-open|weekly-recap (default: flash)
 *   &voice=male|female|neutral (default: neutral)
 *   &audio=true|false (default: true, set false for script-only)
 *
 * GET /api/podcast/feed — Podcast RSS feed for podcast apps
 *
 * Returns:
 *   - With audio=true: audio/mpeg binary
 *   - With audio=false: JSON script
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePodcastEpisode,
  generatePodcastScript,
  type PodcastFormat,
  type VoiceGender,
} from '@/lib/ai-podcast';

export const runtime = 'edge';
export const maxDuration = 60; // TTS can take a while

const VALID_FORMATS: PodcastFormat[] = ['flash', 'deep-dive', 'market-open', 'weekly-recap'];
const VALID_VOICES: VoiceGender[] = ['male', 'female', 'neutral'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const format = (VALID_FORMATS.includes(params.get('format') as PodcastFormat)
    ? params.get('format')
    : 'flash') as PodcastFormat;

  const voice = (VALID_VOICES.includes(params.get('voice') as VoiceGender)
    ? params.get('voice')
    : 'neutral') as VoiceGender;

  const wantAudio = params.get('audio') !== 'false';

  try {
    // Script-only mode
    if (!wantAudio) {
      const script = await generatePodcastScript(format);
      return NextResponse.json(
        {
          episode: {
            id: `podcast-${format}-${Date.now()}`,
            title: script.title,
            description: script.description,
            format,
            script,
            duration: script.totalDuration,
            generatedAt: script.generatedAt,
          },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Full audio episode
    const episode = await generatePodcastEpisode(format, { voiceGender: voice });

    // If TTS produced audio, return as binary MP3
    if (episode.audioBase64) {
      const audioBuffer = Uint8Array.from(atob(episode.audioBase64), c => c.charCodeAt(0));
      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `inline; filename="crypto-pulse-${format}-${Date.now()}.mp3"`,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
          'X-Podcast-Title': episode.title,
          'X-Podcast-Duration': String(episode.duration),
        },
      });
    }

    // No TTS available — return JSON with script
    return NextResponse.json(
      {
        episode,
        note: 'Audio generation unavailable. Set GOOGLE_CLOUD_TTS_API_KEY for audio output.',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[Podcast API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate podcast' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
