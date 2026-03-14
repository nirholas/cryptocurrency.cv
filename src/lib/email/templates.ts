/**
 * Email Templates
 *
 * Pre-built HTML/text templates for transactional emails.
 */

const BRAND_COLOR = '#3b82f6';
const BRAND_NAME = 'Crypto Vision News';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptocurrency.cv';

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    ${content}
    <div style="padding:24px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        ${BRAND_NAME} &mdash; <a href="${SITE_URL}" style="color:${BRAND_COLOR};">${SITE_URL.replace('https://', '')}</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${label}</a>`;
}

/* ─── Magic Link ─── */

export function magicLinkEmail(link: string): { subject: string; html: string; text: string } {
  return {
    subject: `Sign in to ${BRAND_NAME}`,
    html: baseLayout(`
      <div style="padding:40px 32px;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 16px;">Sign in to ${BRAND_NAME}</h1>
        <p style="color:#64748b;font-size:16px;line-height:1.5;margin:0 0 24px;">
          Click the button below to sign in to your developer dashboard. This link expires in 15 minutes.
        </p>
        ${button(link, 'Sign In')}
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;line-height:1.5;">
          If you didn&rsquo;t request this email, you can safely ignore it.<br/>This link will expire in 15 minutes.
        </p>
      </div>
    `),
    text: `Sign in to ${BRAND_NAME}\n\nClick the link below to sign in:\n${link}\n\nThis link expires in 15 minutes. If you didn't request this, ignore this email.`,
  };
}

/* ─── Notification Digest ─── */

export interface DigestNotification {
  title: string;
  link: string;
  source: string;
  description?: string;
  timeAgo: string;
}

export function notificationDigestEmail(
  notifications: DigestNotification[],
  unsubscribeUrl: string,
): { subject: string; html: string; text: string } {
  const count = notifications.length;
  const rows = notifications
    .map(
      (n) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <a href="${n.link}" style="color:#1e293b;text-decoration:none;font-weight:600;font-size:15px;">${n.title}</a>
            ${n.description ? `<p style="margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.4;">${n.description}</p>` : ''}
            <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">${n.source} &bull; ${n.timeAgo}</p>
          </td>
        </tr>`,
    )
    .join('');

  const textList = notifications.map((n) => `- ${n.title} (${n.source})\n  ${n.link}`).join('\n');

  return {
    subject: `Your Crypto News Digest — ${count} update${count !== 1 ? 's' : ''}`,
    html: baseLayout(`
      <div style="padding:32px;background:#000;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">📰 Crypto News Digest</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${count} update${count !== 1 ? 's' : ''} since your last digest</p>
      </div>
      <div style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <p style="margin-top:24px;text-align:center;">
          ${button(`${SITE_URL}/news`, 'View All News')}
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center;">
          <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a> from email digests
        </p>
      </div>
    `),
    text: `Crypto News Digest — ${count} updates\n\n${textList}\n\nView all: ${SITE_URL}/news\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}

/* ─── Alert Triggered ─── */

export interface AlertData {
  ticker: string;
  alertType: string;
  condition: string;
  threshold: number;
  currentValue: number;
  direction?: 'up' | 'down';
}

export function alertTriggeredEmail(alert: AlertData): {
  subject: string;
  html: string;
  text: string;
} {
  const emoji = alert.direction === 'up' ? '🟢' : alert.direction === 'down' ? '🔴' : '⚠️';
  const formatted = alert.currentValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return {
    subject: `${emoji} ${alert.ticker} Alert — ${alert.condition} ${alert.threshold}`,
    html: baseLayout(`
      <div style="padding:40px 32px;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 16px;">
          ${emoji} Price Alert: ${alert.ticker}
        </h1>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px;">
          <p style="margin:0;color:#64748b;font-size:14px;">
            <strong>${alert.ticker}</strong> ${alert.alertType} is now <strong>${formatted}</strong>
          </p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">
            Condition: ${alert.condition} ${alert.threshold}
          </p>
        </div>
        ${button(`${SITE_URL}/dashboard/alerts`, 'View Alerts')}
      </div>
    `),
    text: `${alert.ticker} Alert\n\n${alert.ticker} ${alert.alertType} is now ${formatted}.\nCondition: ${alert.condition} ${alert.threshold}\n\nView alerts: ${SITE_URL}/dashboard/alerts`,
  };
}

/* ─── Welcome ─── */

export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const displayName = name || 'there';
  return {
    subject: `Welcome to ${BRAND_NAME}!`,
    html: baseLayout(`
      <div style="padding:40px 32px;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 16px;">Welcome, ${displayName}!</h1>
        <p style="color:#64748b;font-size:16px;line-height:1.5;margin:0 0 24px;">
          Your ${BRAND_NAME} account is ready. Explore real-time crypto news, set up price alerts, and get personalised digests.
        </p>
        ${button(`${SITE_URL}/dashboard`, 'Go to Dashboard')}
      </div>
    `),
    text: `Welcome, ${displayName}!\n\nYour ${BRAND_NAME} account is ready.\n\nGo to dashboard: ${SITE_URL}/dashboard`,
  };
}

/* ─── Email Verification ─── */

export function emailVerificationEmail(verifyUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Verify your email — ${BRAND_NAME}`,
    html: baseLayout(`
      <div style="padding:40px 32px;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 16px;">Verify Your Email</h1>
        <p style="color:#64748b;font-size:16px;line-height:1.5;margin:0 0 24px;">
          Click below to verify your email address for notifications.
        </p>
        ${button(verifyUrl, 'Verify Email')}
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;line-height:1.5;">
          If you didn&rsquo;t request this, you can safely ignore it.
        </p>
      </div>
    `),
    text: `Verify your email for ${BRAND_NAME} notifications.\n\n${verifyUrl}\n\nIf you didn't request this, ignore this email.`,
  };
}
