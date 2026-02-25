/**
 * Inngest Webhook Handler
 *
 * This route serves as the single endpoint that Inngest uses to communicate
 * with the application. It registers all background functions and handles
 * incoming webhook calls (triggering, completion callbacks, etc.).
 *
 * @route GET|POST|PUT /api/inngest
 * @see https://www.inngest.com/docs/sdk/serve
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { allFunctions } from '@/lib/inngest/functions/index';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — match the longest job (x-sentiment)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});
