/**
 * Newsletter Subscription & Email Digest System
 * 
 * Features:
 * - Email subscription management
 * - Daily/weekly digest generation
 * - Multiple email providers (Resend, SendGrid, Postmark)
 */

// Types
export interface Subscriber {
  id: string;
  email: string;
  frequency: 'daily' | 'weekly' | 'breaking';
  categories: string[];
  sources: string[];
  verified: boolean;
  createdAt: string;
  lastSentAt?: string;
  unsubscribeToken: string;
}

export interface DigestEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// In-memory store (replace with DB in production)
const subscribers = new Map<string, Subscriber>();

// Generate tokens
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Subscribe an email address
 */
export async function subscribe(
  email: string,
  options: {
    frequency?: 'daily' | 'weekly' | 'breaking';
    categories?: string[];
    sources?: string[];
  } = {}
): Promise<{ success: boolean; message: string; subscriber?: Subscriber }> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Invalid email address' };
  }

  // Check if already subscribed
  const existing = Array.from(subscribers.values()).find(s => s.email === email);
  if (existing) {
    return { success: false, message: 'Email already subscribed' };
  }

  const subscriber: Subscriber = {
    id: generateId(),
    email,
    frequency: options.frequency || 'daily',
    categories: options.categories || [],
    sources: options.sources || [],
    verified: false, // Require email verification
    createdAt: new Date().toISOString(),
    unsubscribeToken: generateToken(),
  };

  subscribers.set(subscriber.id, subscriber);

  // TODO: Send verification email
  // await sendVerificationEmail(subscriber);

  return { 
    success: true, 
    message: 'Subscribed successfully. Please check your email to verify.',
    subscriber,
  };
}

/**
 * Verify email subscription
 */
export async function verifySubscription(token: string): Promise<{ success: boolean; message: string }> {
  const subscriber = Array.from(subscribers.values()).find(s => s.unsubscribeToken === token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid verification token' };
  }

  subscriber.verified = true;
  subscribers.set(subscriber.id, subscriber);

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Unsubscribe
 */
export async function unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
  const subscriber = Array.from(subscribers.values()).find(s => s.unsubscribeToken === token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid unsubscribe token' };
  }

  subscribers.delete(subscriber.id);
  return { success: true, message: 'Unsubscribed successfully' };
}

/**
 * Update subscription preferences
 */
export async function updatePreferences(
  token: string,
  options: {
    frequency?: 'daily' | 'weekly' | 'breaking';
    categories?: string[];
    sources?: string[];
  }
): Promise<{ success: boolean; message: string }> {
  const subscriber = Array.from(subscribers.values()).find(s => s.unsubscribeToken === token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid token' };
  }

  if (options.frequency) subscriber.frequency = options.frequency;
  if (options.categories) subscriber.categories = options.categories;
  if (options.sources) subscriber.sources = options.sources;

  subscribers.set(subscriber.id, subscriber);
  return { success: true, message: 'Preferences updated' };
}

/**
 * Get subscribers by frequency
 */
export function getSubscribersByFrequency(frequency: 'daily' | 'weekly' | 'breaking'): Subscriber[] {
  return Array.from(subscribers.values()).filter(
    s => s.verified && s.frequency === frequency
  );
}

/**
 * Generate digest email HTML
 */
export function generateDigestHtml(
  articles: Array<{ title: string; link: string; source: string; description?: string; timeAgo: string }>,
  subscriber: Subscriber
): string {
  const articlesList = articles
    .map(
      (a) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
          <a href="${a.link}" style="color: #1a1a1a; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${a.title}
          </a>
          <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
            ${a.description || ''}
          </p>
          <p style="margin: 8px 0 0; color: #999; font-size: 12px;">
            ${a.source} • ${a.timeAgo}
          </p>
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crypto News Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); text-align: center;">
        <h1 style="margin: 0; color: #000; font-size: 24px;">📰 Crypto News Digest</h1>
        <p style="margin: 8px 0 0; color: #333; font-size: 14px;">Your ${subscriber.frequency} crypto news summary</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${articlesList}
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 24px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 12px;">
          You're receiving this because you subscribed to Free Crypto News.
        </p>
        <p style="margin: 8px 0 0;">
          <a href="https://free-crypto-news.vercel.app/unsubscribe?token=${subscriber.unsubscribeToken}" 
             style="color: #999; font-size: 12px;">
            Unsubscribe
          </a>
          •
          <a href="https://free-crypto-news.vercel.app/preferences?token=${subscriber.unsubscribeToken}" 
             style="color: #999; font-size: 12px;">
            Update Preferences
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate plain text version
 */
export function generateDigestText(
  articles: Array<{ title: string; link: string; source: string; timeAgo: string }>,
  subscriber: Subscriber
): string {
  const articlesList = articles
    .map((a) => `• ${a.title}\n  ${a.source} • ${a.timeAgo}\n  ${a.link}`)
    .join('\n\n');

  return `
CRYPTO NEWS DIGEST
Your ${subscriber.frequency} crypto news summary

${articlesList}

---
Unsubscribe: https://free-crypto-news.vercel.app/unsubscribe?token=${subscriber.unsubscribeToken}
Update Preferences: https://free-crypto-news.vercel.app/preferences?token=${subscriber.unsubscribeToken}
  `.trim();
}

/**
 * Send email via Resend
 */
export async function sendViaResend(email: DigestEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Crypto News <digest@free-crypto-news.vercel.app>',
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Resend error:', error);
    return false;
  }
}

/**
 * Send email via SendGrid
 */
export async function sendViaSendGrid(email: DigestEmail): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email.to }] }],
        from: { email: 'digest@free-crypto-news.vercel.app', name: 'Crypto News' },
        subject: email.subject,
        content: [
          { type: 'text/plain', value: email.text },
          { type: 'text/html', value: email.html },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

/**
 * Get subscriber stats
 */
export function getSubscriberStats(): {
  total: number;
  verified: number;
  byFrequency: Record<string, number>;
} {
  const all = Array.from(subscribers.values());
  
  return {
    total: all.length,
    verified: all.filter(s => s.verified).length,
    byFrequency: {
      daily: all.filter(s => s.frequency === 'daily').length,
      weekly: all.filter(s => s.frequency === 'weekly').length,
      breaking: all.filter(s => s.frequency === 'breaking').length,
    },
  };
}
