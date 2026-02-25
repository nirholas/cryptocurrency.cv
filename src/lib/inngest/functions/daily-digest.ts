/**
 * Daily Digest — Inngest Function
 *
 * Triggers:
 *   - Cron: daily at 08:00 UTC
 *
 * Fan-out: Processes AI summarisation with parallel category steps.
 *
 * Migrated from /api/cron/digest
 */

import { inngest } from '../client';

export const dailyDigest = inngest.createFunction(
  {
    id: 'daily-digest',
    name: 'AI Daily Digest',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 8 * * *' },
  async ({ step, logger }) => {
    // Step 1 — Determine base URL
    const baseUrl = await step.run('resolve-base-url', async () => {
      if (process.env.NEXTAUTH_URL)
        return process.env.NEXTAUTH_URL.replace(/\/$/, '');
      if (process.env.VERCEL_URL)
        return `https://${process.env.VERCEL_URL}`;
      return 'http://localhost:3000';
    });

    // Step 2 — Fetch digest from internal API
    const digestPayload = await step.run('fetch-digest', async () => {
      const res = await fetch(`${baseUrl}/api/digest?format=ai-digest`, {
        headers: { 'x-internal-cron': '1' },
        cache: 'no-store',
      });
      if (!res.ok) {
        const details = await res.text().catch(() => String(res.status));
        throw new Error(`Digest fetch failed (${res.status}): ${details}`);
      }
      return res.json();
    });

    // Step 3 — Persist to archive/meta/
    const savedPath = await step.run('persist-archive', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const date: string =
        digestPayload.date ?? new Date().toISOString().slice(0, 10);
      const filename = `daily-digest-${date}.json`;
      const filepath = path.join(process.cwd(), 'archive', 'meta', filename);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(
        filepath,
        JSON.stringify(digestPayload, null, 2),
        'utf-8',
      );
      return `archive/meta/${filename}`;
    });

    // Step 4 — Optional newsletter webhook
    const webhookUrl = process.env.NEWSLETTER_WEBHOOK;
    if (webhookUrl) {
      await step.run('notify-webhook', async () => {
        const date =
          digestPayload.date ?? new Date().toISOString().slice(0, 10);
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'daily-digest',
            date,
            sections_generated: digestPayload.sections?.length ?? 0,
            digest_url: `${baseUrl}/api/digest?format=ai-digest`,
            generated_at: digestPayload.generated_at,
          }),
        });
      });
    }

    logger.info('Digest persisted', { savedPath });

    return {
      success: true,
      sections_generated: digestPayload.sections?.length ?? 0,
      saved_to: savedPath,
    };
  },
);
