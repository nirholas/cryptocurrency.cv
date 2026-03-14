/**
 * Send Email Digest — Inngest Function
 *
 * Cron: daily at 09:00 UTC
 * Queries users with emailEnabled + emailDigestFrequency === 'daily',
 * fetches recent articles, and sends a personalised digest email.
 */

import { inngest } from '../client';

export const sendDailyEmailDigest = inngest.createFunction(
  {
    id: 'send-daily-email-digest',
    name: 'Send Daily Email Digest',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 9 * * *' },
  async ({ step, logger }) => {
    // Step 1 — Fetch users who want a daily email digest
    const eligibleUsers = await step.run('fetch-eligible-users', async () => {
      const { getDb } = await import('@/lib/db');
      const { notificationPreferences, users } = await import('@/lib/db/schema');
      const { eq, and } = await import('drizzle-orm');

      const db = getDb();
      if (!db) return [];

      const rows = await db
        .select({
          userId: notificationPreferences.userId,
          email: users.email,
          name: users.name,
          lastDigestSentAt: notificationPreferences.lastDigestSentAt,
        })
        .from(notificationPreferences)
        .innerJoin(users, eq(users.id, notificationPreferences.userId))
        .where(
          and(
            eq(notificationPreferences.emailEnabled, true),
            eq(notificationPreferences.emailVerified, true),
            eq(notificationPreferences.emailDigestFrequency, 'daily'),
          ),
        );

      return rows;
    });

    if (eligibleUsers.length === 0) {
      logger.info('No users eligible for daily email digest');
      return { success: true, sent: 0 };
    }

    // Step 2 — Fetch recent articles for the digest
    const articles = await step.run('fetch-recent-articles', async () => {
      const { getDb } = await import('@/lib/db');
      const { articles } = await import('@/lib/db/schema');
      const { desc, gt } = await import('drizzle-orm');

      const db = getDb();
      if (!db) return [];

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
      const rows = await db
        .select({
          title: articles.title,
          link: articles.link,
          source: articles.source,
          description: articles.description,
          pubDate: articles.pubDate,
        })
        .from(articles)
        .where(gt(articles.pubDate, since))
        .orderBy(desc(articles.pubDate))
        .limit(20);

      return rows.map((r) => ({
        title: r.title,
        link: r.link,
        source: r.source,
        description: r.description || undefined,
        timeAgo: r.pubDate ? formatTimeAgo(r.pubDate) : 'recently',
      }));
    });

    if (articles.length === 0) {
      logger.info('No recent articles for digest');
      return { success: true, sent: 0, reason: 'no-articles' };
    }

    // Step 3 — Send digest to each user
    let sentCount = 0;
    for (const user of eligibleUsers) {
      await step.run(`send-digest-${user.userId}`, async () => {
        const { sendEmail, notificationDigestEmail } = await import('@/lib/email');
        const { getDb } = await import('@/lib/db');
        const { notificationPreferences } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptocurrency.cv';
        const unsubscribeUrl = `${baseUrl}/notifications`;

        const template = notificationDigestEmail(articles, unsubscribeUrl);
        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          tags: [{ name: 'type', value: 'daily-digest' }],
        });

        // Update last sent timestamp
        const db = getDb();
        if (db) {
          await db
            .update(notificationPreferences)
            .set({ lastDigestSentAt: new Date() })
            .where(eq(notificationPreferences.userId, user.userId));
        }
      });
      sentCount++;
    }

    logger.info(`Daily email digest sent to ${sentCount} users`);
    return { success: true, sent: sentCount, articles: articles.length };
  },
);

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  return '1 day ago';
}
