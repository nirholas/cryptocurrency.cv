/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { intParam } from '@/lib/query-params';

interface InfluencerScore {
  handle: string;
  platform: 'twitter' | 'youtube' | 'telegram' | 'other';
  reliability_score: number; // 0-100
  total_predictions: number;
  accurate_predictions: number;
  accuracy_rate: number;
  avg_response_time_hours: number;
  sentiment_accuracy: number;
  categories: string[];
  last_updated: string;
}

const INFLUENCER_PREFIX = 'influencer:score:';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const platform = searchParams.get('platform') || 'twitter';
    const minScore = intParam(searchParams, 'min_score', { fallback: 0, min: 0, max: 100 });
    
    if (handle) {
      const key = `${INFLUENCER_PREFIX}${platform}:${handle.toLowerCase()}`;
      const score = await kv.get<InfluencerScore>(key);
      return NextResponse.json({ influencer: score || null });
    }
    
    // Get leaderboard
    const keys = await kv.keys(`${INFLUENCER_PREFIX}*`);
    const scores = await Promise.all(
      keys.slice(0, 200).map(async (key) => {
        const score = await kv.get<InfluencerScore>(key);
        return score;
      })
    );
    
    const validScores = (scores.filter(Boolean) as InfluencerScore[])
      .filter(s => s.reliability_score >= minScore)
      .sort((a, b) => b.reliability_score - a.reliability_score);

    return NextResponse.json({
      total: validScores.length,
      leaderboard: validScores.slice(0, 50).map(s => ({
        handle: s.handle,
        platform: s.platform,
        reliability_score: s.reliability_score,
        accuracy_rate: s.accuracy_rate,
        total_predictions: s.total_predictions
      })),
      methodology: {
        factors: [
          'Prediction accuracy over time',
          'Sentiment analysis alignment with market moves',
          'Timeliness of calls',
          'Consistency of analysis quality'
        ],
        score_range: '0-100',
        minimum_predictions: 10
      }
    });
  } catch (error) {
    console.error('Influencer score error:', error);
    return NextResponse.json({ error: 'Score fetch failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, platform = 'twitter', prediction_result } = body;
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle required' }, { status: 400 });
    }

    const key = `${INFLUENCER_PREFIX}${platform}:${handle.toLowerCase()}`;
    const existing = await kv.get<InfluencerScore>(key) || {
      handle: handle.toLowerCase(),
      platform,
      reliability_score: 50,
      total_predictions: 0,
      accurate_predictions: 0,
      accuracy_rate: 0,
      avg_response_time_hours: 0,
      sentiment_accuracy: 50,
      categories: [],
      last_updated: new Date().toISOString()
    };

    if (prediction_result !== undefined) {
      existing.total_predictions++;
      if (prediction_result) {
        existing.accurate_predictions++;
      }
      existing.accuracy_rate = (existing.accurate_predictions / existing.total_predictions) * 100;
      
      // Recalculate reliability score
      const accuracyWeight = 0.6;
      const volumeWeight = 0.2;
      const sentimentWeight = 0.2;
      
      const volumeScore = Math.min(100, existing.total_predictions * 2);
      existing.reliability_score = Math.round(
        existing.accuracy_rate * accuracyWeight +
        volumeScore * volumeWeight +
        existing.sentiment_accuracy * sentimentWeight
      );
    }

    existing.last_updated = new Date().toISOString();
    await kv.set(key, existing);
    
    return NextResponse.json({ success: true, score: existing });
  } catch (error) {
    console.error('Influencer update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
