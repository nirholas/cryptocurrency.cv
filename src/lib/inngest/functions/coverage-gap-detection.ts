/**
 * Coverage Gap Detection — Inngest Function
 *
 * Triggers:
 *   - Cron: every 6 hours
 *
 * Output: emits article/needs-coverage events for detected gaps.
 *
 * Migrated from /api/cron/coverage-gap
 */

import { inngest } from '../client';

export const coverageGapDetection = inngest.createFunction(
  {
    id: 'coverage-gap-detection',
    name: 'Coverage Gap Detection',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 */6 * * *' },
  async ({ step, logger }) => {
    // Step 1 — Load indexes
    const indexes = await step.run('load-indexes', async () => {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const root = path.join(process.cwd(), 'archive');

      let byDate: Record<string, string[]> = {};
      let byTicker: Record<string, string[]> = {};

      try {
        byDate = JSON.parse(
          await fs.readFile(
            path.join(root, 'indexes', 'by-date.json'),
            'utf-8',
          ),
        );
      } catch {
        /* empty */
      }

      try {
        byTicker = JSON.parse(
          await fs.readFile(
            path.join(root, 'indexes', 'by-ticker.json'),
            'utf-8',
          ),
        );
      } catch {
        /* empty */
      }

      return { byDate, byTicker };
    });

    // Step 2 — Analyse gaps
    const gaps = await step.run('analyze-gaps', async () => {
      const { byDate, byTicker } = indexes;

      function lastNDays(days: number): string[] {
        const result: string[] = [];
        const now = new Date();
        for (let i = 0; i < days; i++) {
          const d = new Date(now);
          d.setUTCDate(d.getUTCDate() - i);
          result.push(d.toISOString().slice(0, 10));
        }
        return result;
      }

      const days7 = new Set(lastNDays(7));
      const days2 = new Set(lastNDays(2));
      const idsIn48h = new Set<string>();

      for (const [date, ids] of Object.entries(byDate)) {
        if (days7.has(date)) { /* track 7-day window */ }
        if (days2.has(date)) ids.forEach((id) => idsIn48h.add(id));
      }

      const allDates = Object.keys(byDate).sort();
      const oldestDate = allDates[0];
      const newestDate = allDates[allDates.length - 1];
      let totalWeeks = 1;
      if (oldestDate && newestDate) {
        const ms =
          new Date(newestDate).getTime() - new Date(oldestDate).getTime();
        totalWeeks = Math.max(1, ms / (7 * 24 * 60 * 60 * 1000));
      }

      const idToDate = new Map<string, string>();
      for (const [date, ids] of Object.entries(byDate)) {
        for (const id of ids) {
          const existing = idToDate.get(id);
          if (!existing || date > existing) idToDate.set(id, date);
        }
      }

      interface TagStat {
        tag: string;
        ids48h: number;
        historicalTotal: number;
        lastArticleDate: string | null;
      }

      const tagStats: TagStat[] = [];
      for (const [tag, allIds] of Object.entries(byTicker)) {
        const normalised = tag.toLowerCase();
        let ids48hCount = 0;
        for (const id of allIds) {
          if (idsIn48h.has(id)) ids48hCount++;
        }

        let lastDate: string | null = null;
        for (const id of allIds) {
          const d = idToDate.get(id) ?? null;
          if (d && (!lastDate || d > lastDate)) lastDate = d;
        }

        const avgPerWeek = allIds.length / totalWeeks;
        if (ids48hCount < 2 && avgPerWeek > 10) {
          tagStats.push({
            tag: normalised,
            ids48h: ids48hCount,
            historicalTotal: allIds.length,
            lastArticleDate: lastDate,
          });
        }
      }

      tagStats.sort((a, b) => {
        const scoreA =
          a.historicalTotal / totalWeeks / Math.max(1, a.ids48h);
        const scoreB =
          b.historicalTotal / totalWeeks / Math.max(1, b.ids48h);
        return scoreB - scoreA;
      });

      return tagStats.slice(0, 20).map((s) => {
        const avgPerWeek = s.historicalTotal / totalWeeks;
        const now = new Date();
        const lastCoverage = s.lastArticleDate
          ? new Date(s.lastArticleDate)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const gapHours = Math.round(
          (now.getTime() - lastCoverage.getTime()) / (60 * 60 * 1000),
        );

        return {
          tag: s.tag,
          gap_score: Math.round(
            (avgPerWeek / Math.max(1, s.ids48h)) * 10,
          ),
          last_article_date: s.lastArticleDate,
          gap_hours: gapHours,
          suggested_headline: `Coverage gap: "${s.tag}" — ${s.ids48h} article${s.ids48h === 1 ? '' : 's'} in last 48 h (avg ${avgPerWeek.toFixed(1)}/week)`,
        };
      });
    });

    // Step 3 — Persist report
    const reportPath = await step.run('persist-report', async () => {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const today = new Date().toISOString().slice(0, 10);
      const report = {
        generated_at: new Date().toISOString(),
        date: today,
        window_days: 7,
        gaps,
      };
      const metaDir = path.join(process.cwd(), 'archive', 'meta');
      await fs.mkdir(metaDir, { recursive: true });
      const filePath = path.join(metaDir, `coverage-gaps-${today}.json`);
      await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
      return `archive/meta/coverage-gaps-${today}.json`;
    });

    // Step 4 — Emit events for detected gaps (event-driven architecture)
    if (gaps.length > 0) {
      await step.sendEvent(
        'emit-coverage-gaps',
        gaps.slice(0, 10).map((gap) => ({
          name: 'article/needs-coverage' as const,
          data: {
            topic: gap.tag,
            lastCoverageAt: gap.last_article_date ?? new Date().toISOString(),
            gapHours: gap.gap_hours,
          },
        })),
      );
    }

    logger.info('Coverage gap report written', {
      gaps: gaps.length,
      reportPath,
      eventsEmitted: Math.min(gaps.length, 10),
    });

    return { success: true, gaps_found: gaps.length, report_path: reportPath };
  },
);
