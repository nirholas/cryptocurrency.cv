/**
 * AI Price Predictions — Inngest Function
 *
 * Triggers:
 *   - Cron: daily at midnight UTC
 *
 * Logic: Fetches prices, scores yesterday's predictions, generates new ones.
 * Timeout: 10 minutes (AI inference heavy)
 *
 * Migrated from /api/cron/predictions
 */

import { NonRetriableError } from 'inngest';
import { inngest } from '../client';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'ripple', symbol: 'XRP' },
];

export const predictions = inngest.createFunction(
  {
    id: 'predictions',
    name: 'AI Price Predictions',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 0 * * *' },
  async ({ step, logger }) => {
    const today = new Date().toISOString().slice(0, 10);

    // Step 1 — Fetch current prices
    const prices = await step.run('fetch-prices', async () => {
      const { COINGECKO_BASE } = await import('@/lib/constants');
      const ids = COINS.map((c) => c.id).join(',');
      const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
      const data = (await res.json()) as Record<string, { usd: number }>;
      return Object.fromEntries(
        Object.entries(data).map(([id, v]) => [id, v.usd]),
      );
    });

    // Step 2 — Score yesterday's predictions
    await step.run('score-yesterday', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const archiveDir = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
      );
      const yesterday = new Date(Date.now() - 86_400_000)
        .toISOString()
        .slice(0, 10);
      const filePath = pathMod.join(archiveDir, `${yesterday}.json`);

      let file: {
        date: string;
        predictions: Array<Record<string, unknown>>;
        results?: unknown[];
      } | null = null;
      try {
        file = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      } catch {
        return; // no file to score
      }
      if (!file || (file.results && (file.results as unknown[]).length > 0))
        return;

      const scoredAt = new Date().toISOString();
      const results = (
        file.predictions as Array<{
          coin: string;
          coingecko_id: string;
          predicted_24h: number;
          current_price: number;
        }>
      )
        .filter((p) => prices[p.coingecko_id] !== undefined)
        .map((p) => {
          const actual = prices[p.coingecko_id];
          const delta_pct =
            ((actual - p.predicted_24h) / p.predicted_24h) * 100;
          const predictedUp = p.predicted_24h > p.current_price;
          const actualUp = actual > p.current_price;
          return {
            coin: p.coin,
            coingecko_id: p.coingecko_id,
            predicted_price_24h: p.predicted_24h,
            actual_price: actual,
            delta_pct: Math.round(delta_pct * 100) / 100,
            direction_correct: predictedUp === actualUp,
            scored_at: scoredAt,
          };
        });

      file.results = results;
      await fs.mkdir(pathMod.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(file, null, 2), 'utf-8');
    });

    // Step 3 — Check idempotency
    const existing = await step.run('check-existing', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const filePath = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
        `${today}.json`,
      );
      try {
        const raw = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        if (raw?.predictions?.length > 0) return raw;
      } catch {
        /* file doesn't exist yet */
      }
      return null;
    });

    if (existing) {
      logger.info('Predictions already exist for today', { date: today });
      return {
        success: true,
        date: today,
        message: 'Predictions already written for today',
        predictions: existing.predictions.length,
      };
    }

    // Step 4 — Generate AI predictions
    const predictionsData = await step.run(
      'generate-predictions',
      async () => {
        const { getAIConfigOrNull, aiComplete } = await import(
          '@/lib/ai-provider'
        );
        const aiConfig = getAIConfigOrNull(true); // prefer Groq
        if (!aiConfig) {
          throw new NonRetriableError('No AI provider configured');
        }

        const now = new Date().toISOString();
        const priceLines = COINS.map(
          (c) =>
            `${c.symbol} (${c.id}): $${prices[c.id]?.toLocaleString() ?? 'N/A'}`,
        ).join('\n');

        const systemPrompt =
          'You are a quantitative crypto analyst. Your task is to produce short-term price predictions. Reply ONLY with valid JSON — no markdown, no commentary. The JSON must be an array of prediction objects.';

        const userPrompt = `Current prices (UTC ${now}):\n${priceLines}\n\nFor each coin, predict:\n- predicted_24h: price after 24 hours\n- predicted_7d: price after 7 days\n- reasoning: 1-2 sentences of technical/macro rationale\n- confidence: float 0.0–1.0\n\nRespond ONLY with this JSON array (no markdown):\n[\n  {\n    "coin": "BTC",\n    "coingecko_id": "bitcoin",\n    "current_price": 0,\n    "predicted_24h": 0,\n    "predicted_7d": 0,\n    "reasoning": "...",\n    "confidence": 0.0\n  },\n  ...\n]`;

        const raw = await aiComplete(systemPrompt, userPrompt, {
          maxTokens: 800,
          temperature: 0.4,
          jsonMode: true,
        });

        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch)
          throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          coin: string;
          coingecko_id: string;
          current_price: number;
          predicted_24h: number;
          predicted_7d: number;
          reasoning: string;
          confidence: number;
        }>;

        return parsed.map((p) => ({
          coin: p.coin,
          coingecko_id: p.coingecko_id,
          current_price: prices[p.coingecko_id] ?? p.current_price,
          predicted_24h: p.predicted_24h,
          predicted_7d: p.predicted_7d,
          reasoning: p.reasoning,
          confidence: Math.min(1, Math.max(0, p.confidence ?? 0.5)),
          model: aiConfig.model,
          timestamp: now,
        }));
      },
    );

    // Step 5 — Persist predictions
    await step.run('persist-predictions', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const archiveDir = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
      );
      await fs.mkdir(archiveDir, { recursive: true });
      await fs.writeFile(
        pathMod.join(archiveDir, `${today}.json`),
        JSON.stringify(
          { date: today, predictions: predictionsData },
          null,
          2,
        ),
        'utf-8',
      );
    });

    // Step 6 — Emit price alert events if large predicted moves
    const bigMoves = predictionsData.filter((p) => {
      const changePct = Math.abs(
        ((p.predicted_24h - p.current_price) / p.current_price) * 100,
      );
      return changePct >= 5; // 5%+ predicted move
    });

    if (bigMoves.length > 0) {
      await step.sendEvent(
        'emit-price-alerts',
        bigMoves.map((p) => ({
          name: 'market/price-alert' as const,
          data: {
            ticker: p.coin,
            currentPrice: p.current_price,
            previousPrice: p.current_price,
            changePercent: Math.round(
              ((p.predicted_24h - p.current_price) / p.current_price) * 100 *
                100,
            ) / 100,
            direction: (p.predicted_24h > p.current_price
              ? 'up'
              : 'down') as 'up' | 'down',
          },
        })),
      );
    }

    logger.info('Predictions generated', {
      date: today,
      coins: predictionsData.map((p) => p.coin),
      bigMoves: bigMoves.length,
    });

    return {
      success: true,
      date: today,
      predictions: predictionsData.length,
      coins: predictionsData.map((p) => p.coin),
    };
  },
);
