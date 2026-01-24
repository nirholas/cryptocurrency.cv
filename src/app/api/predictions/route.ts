/**
 * @fileoverview Prediction Tracking & Accuracy Scoring
 * Track predictions made in crypto news and score their accuracy
 */

import { NextRequest, NextResponse } from 'next/server';

interface Prediction {
  id: string;
  source: string;
  articleUrl: string;
  articleTitle: string;
  predictionText: string;
  predictionType: 'price' | 'event' | 'timeline' | 'market' | 'technology';
  target: string; // e.g., "BTC", "ETH", or event name
  direction?: 'up' | 'down' | 'neutral';
  targetValue?: number;
  targetDate?: string;
  confidence?: number;
  madeAt: string;
  evaluatedAt?: string;
  outcome?: 'correct' | 'incorrect' | 'partial' | 'pending';
  accuracyScore?: number;
  notes?: string;
}

interface SourceAccuracy {
  source: string;
  totalPredictions: number;
  evaluated: number;
  correct: number;
  incorrect: number;
  partial: number;
  pending: number;
  accuracyRate: number;
  avgConfidence: number;
  byType: Record<string, { total: number; correct: number; rate: number }>;
}

// In-memory store (use database in production)
const predictions: Prediction[] = [];

/**
 * GET: Retrieve predictions with filtering
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const outcome = searchParams.get('outcome');
  const type = searchParams.get('type');
  const target = searchParams.get('target');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let filtered = [...predictions];

  if (source) {
    filtered = filtered.filter((p) =>
      p.source.toLowerCase().includes(source.toLowerCase())
    );
  }

  if (outcome) {
    filtered = filtered.filter((p) => p.outcome === outcome);
  }

  if (type) {
    filtered = filtered.filter((p) => p.predictionType === type);
  }

  if (target) {
    filtered = filtered.filter((p) =>
      p.target.toLowerCase().includes(target.toLowerCase())
    );
  }

  // Sort by date, newest first
  filtered.sort(
    (a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime()
  );

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  // Calculate overall stats
  const stats = calculateStats(predictions);

  return NextResponse.json({
    predictions: paginated,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
    stats,
  });
}

/**
 * POST: Add a new prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.source || !body.predictionText || !body.target) {
      return NextResponse.json(
        { error: 'Missing required fields: source, predictionText, target' },
        { status: 400 }
      );
    }

    const prediction: Prediction = {
      id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: body.source,
      articleUrl: body.articleUrl || '',
      articleTitle: body.articleTitle || '',
      predictionText: body.predictionText,
      predictionType: body.predictionType || 'market',
      target: body.target,
      direction: body.direction,
      targetValue: body.targetValue,
      targetDate: body.targetDate,
      confidence: body.confidence,
      madeAt: body.madeAt || new Date().toISOString(),
      outcome: 'pending',
    };

    predictions.push(prediction);

    return NextResponse.json({
      message: 'Prediction recorded',
      prediction,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * PATCH: Update prediction outcome
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, outcome, accuracyScore, notes } = body;

    if (!id || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: id, outcome' },
        { status: 400 }
      );
    }

    const prediction = predictions.find((p) => p.id === id);
    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    prediction.outcome = outcome;
    prediction.evaluatedAt = new Date().toISOString();
    if (accuracyScore !== undefined) prediction.accuracyScore = accuracyScore;
    if (notes) prediction.notes = notes;

    return NextResponse.json({
      message: 'Prediction updated',
      prediction,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * Calculate accuracy statistics
 */
function calculateStats(preds: Prediction[]) {
  const total = preds.length;
  const evaluated = preds.filter((p) => p.outcome !== 'pending').length;
  const correct = preds.filter((p) => p.outcome === 'correct').length;
  const incorrect = preds.filter((p) => p.outcome === 'incorrect').length;
  const partial = preds.filter((p) => p.outcome === 'partial').length;
  const pending = preds.filter((p) => p.outcome === 'pending').length;

  // Overall accuracy (correct + 0.5*partial) / evaluated
  const accuracyRate =
    evaluated > 0
      ? ((correct + 0.5 * partial) / evaluated) * 100
      : 0;

  // By type
  const byType: Record<
    string,
    { total: number; correct: number; rate: number }
  > = {};
  const types = ['price', 'event', 'timeline', 'market', 'technology'];
  for (const type of types) {
    const typePreds = preds.filter((p) => p.predictionType === type);
    const typeEvaluated = typePreds.filter(
      (p) => p.outcome !== 'pending'
    ).length;
    const typeCorrect = typePreds.filter((p) => p.outcome === 'correct').length;
    byType[type] = {
      total: typePreds.length,
      correct: typeCorrect,
      rate: typeEvaluated > 0 ? (typeCorrect / typeEvaluated) * 100 : 0,
    };
  }

  // By source
  const sourceAccuracy: SourceAccuracy[] = [];
  const sources = [...new Set(preds.map((p) => p.source))];

  for (const source of sources) {
    const sourcePreds = preds.filter((p) => p.source === source);
    const sourceEval = sourcePreds.filter((p) => p.outcome !== 'pending');
    const sourceCorrect = sourcePreds.filter(
      (p) => p.outcome === 'correct'
    ).length;
    const sourcePartial = sourcePreds.filter(
      (p) => p.outcome === 'partial'
    ).length;

    const sourceByType: Record<
      string,
      { total: number; correct: number; rate: number }
    > = {};
    for (const type of types) {
      const typePreds = sourcePreds.filter((p) => p.predictionType === type);
      const typeEval = typePreds.filter((p) => p.outcome !== 'pending').length;
      const typeCorrect = typePreds.filter(
        (p) => p.outcome === 'correct'
      ).length;
      sourceByType[type] = {
        total: typePreds.length,
        correct: typeCorrect,
        rate: typeEval > 0 ? (typeCorrect / typeEval) * 100 : 0,
      };
    }

    sourceAccuracy.push({
      source,
      totalPredictions: sourcePreds.length,
      evaluated: sourceEval.length,
      correct: sourceCorrect,
      incorrect: sourcePreds.filter((p) => p.outcome === 'incorrect').length,
      partial: sourcePartial,
      pending: sourcePreds.filter((p) => p.outcome === 'pending').length,
      accuracyRate:
        sourceEval.length > 0
          ? ((sourceCorrect + 0.5 * sourcePartial) / sourceEval.length) * 100
          : 0,
      avgConfidence:
        sourcePreds.filter((p) => p.confidence).length > 0
          ? sourcePreds
              .filter((p) => p.confidence)
              .reduce((sum, p) => sum + (p.confidence || 0), 0) /
            sourcePreds.filter((p) => p.confidence).length
          : 0,
      byType: sourceByType,
    });
  }

  // Sort by accuracy rate
  sourceAccuracy.sort((a, b) => b.accuracyRate - a.accuracyRate);

  return {
    total,
    evaluated,
    correct,
    incorrect,
    partial,
    pending,
    accuracyRate: parseFloat(accuracyRate.toFixed(1)),
    byType,
    topSources: sourceAccuracy.slice(0, 10),
  };
}
