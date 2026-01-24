/**
 * Newsletter Subscription & Email Digest System
 * 
 * Features:
 * - Email subscription management with database persistence
 * - Daily/weekly digest generation
 * - Multiple email providers (Resend, SendGrid, Postmark)
 * - Email verification flow
 */

import { db } from '@/lib/database';

// Database collection
const SUBSCRIBERS_COLLECTION = 'newsletter_subscribers';

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
  verificationToken?: string;
}

export interface DigestEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Database-backed subscriber storage helper functions
async function getAllSubscribers(): Promise<Subscriber[]> {
  try {
    const docs = await db.listDocuments<Subscriber>(SUBSCRIBERS_COLLECTION, { limit: 10000 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get subscribers from database:', error);
    return [];
  }
}

async function getSubscriberById(id: string): Promise<Subscriber | null> {
  try {
    const doc = await db.getDocument<Subscriber>(SUBSCRIBERS_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveSubscriber(subscriber: Subscriber): Promise<void> {
  await db.saveDocument(SUBSCRIBERS_COLLECTION, subscriber.id, subscriber, {
    email: subscriber.email,
    frequency: subscriber.frequency,
    verified: subscriber.verified,
  });
}

async function deleteSubscriberById(id: string): Promise<boolean> {
  return db.deleteDocument(SUBSCRIBERS_COLLECTION, id);
}

async function findSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const all = await getAllSubscribers();
  return all.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
}

async function findSubscriberByToken(token: string): Promise<Subscriber | null> {
  const all = await getAllSubscribers();
  return all.find(s => s.unsubscribeToken === token || s.verificationToken === token) || null;
}

// Import crypto for secure ID generation
import { randomUUID } from 'crypto';

// Generate tokens using cryptographic randomness
function generateToken(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').substring(0, 8);
}

function generateId(): string {
  return `sub_${randomUUID()}`;
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
  const existing = await findSubscriberByEmail(email);
  if (existing) {
    return { success: false, message: 'Email already subscribed' };
  }

  const verificationToken = generateToken();
  const subscriber: Subscriber = {
    id: generateId(),
    email,
    frequency: options.frequency || 'daily',
    categories: options.categories || [],
    sources: options.sources || [],
    verified: false, // Require email verification
    createdAt: new Date().toISOString(),
    unsubscribeToken: generateToken(),
    verificationToken,
  };

  await saveSubscriber(subscriber);

  // Send verification email
  await sendVerificationEmail(subscriber, verificationToken);

  return { 
    success: true, 
    message: 'Subscribed successfully. Please check your email to verify.',
    subscriber,
  };
}

/**
 * Send verification email using configured provider
 */
async function sendVerificationEmail(subscriber: Subscriber, token: string): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://free-crypto-news.vercel.app'}/api/newsletter?action=verify&token=${token}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 32px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); text-align: center;">
      <h1 style="margin: 0; color: #000; font-size: 24px;">📰 Free Crypto News</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 16px; color: #1a1a1a;">Verify Your Email</h2>
      <p style="color: #666; line-height: 1.6;">
        Thanks for subscribing to the ${subscriber.frequency} crypto news digest! 
        Click the button below to verify your email address and start receiving updates.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background-color: #F59E0B; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
      </div>
      <p style="color: #999; font-size: 12px;">
        If you didn't subscribe to Free Crypto News, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Verify Your Email - Free Crypto News

Thanks for subscribing to the ${subscriber.frequency} crypto news digest!
Click the link below to verify your email address:

${verifyUrl}

If you didn't subscribe, you can safely ignore this email.
  `.trim();

  // Try different email providers in order
  const sent = await sendEmail({
    to: subscriber.email,
    subject: 'Verify Your Email - Free Crypto News',
    html,
    text,
  });

  if (!sent) {
    console.warn(`Failed to send verification email to ${subscriber.email}`);
  }
}

/**
 * Send email using configured provider (Resend, SendGrid, or Postmark)
 */
async function sendEmail(email: DigestEmail): Promise<boolean> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@free-crypto-news.vercel.app',
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });
      if (response.ok) return true;
    } catch (error) {
      console.error('Resend error:', error);
    }
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: email.to }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@free-crypto-news.vercel.app' },
          subject: email.subject,
          content: [
            { type: 'text/plain', value: email.text },
            { type: 'text/html', value: email.html },
          ],
        }),
      });
      if (response.ok) return true;
    } catch (error) {
      console.error('SendGrid error:', error);
    }
  }

  // Try Postmark
  if (process.env.POSTMARK_API_KEY) {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: process.env.EMAIL_FROM || 'noreply@free-crypto-news.vercel.app',
          To: email.to,
          Subject: email.subject,
          HtmlBody: email.html,
          TextBody: email.text,
        }),
      });
      if (response.ok) return true;
    } catch (error) {
      console.error('Postmark error:', error);
    }
  }

  // No email provider configured - log warning
  console.warn('No email provider configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY');
  return false;
}

/**
 * Verify email subscription
 */
export async function verifySubscription(token: string): Promise<{ success: boolean; message: string }> {
  const subscriber = await findSubscriberByToken(token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid verification token' };
  }

  subscriber.verified = true;
  subscriber.verificationToken = undefined; // Clear verification token after use
  await saveSubscriber(subscriber);

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Unsubscribe
 */
export async function unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
  const subscriber = await findSubscriberByToken(token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid unsubscribe token' };
  }

  await deleteSubscriberById(subscriber.id);
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
  const subscriber = await findSubscriberByToken(token);
  
  if (!subscriber) {
    return { success: false, message: 'Invalid token' };
  }

  if (options.frequency) subscriber.frequency = options.frequency;
  if (options.categories) subscriber.categories = options.categories;
  if (options.sources) subscriber.sources = options.sources;

  await saveSubscriber(subscriber);
  return { success: true, message: 'Preferences updated' };
}

/**
 * Get subscribers by frequency
 */
export async function getSubscribersByFrequency(frequency: 'daily' | 'weekly' | 'breaking'): Promise<Subscriber[]> {
  const all = await getAllSubscribers();
  return all.filter(s => s.verified && s.frequency === frequency);
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
export async function getSubscriberStats(): Promise<{
  total: number;
  verified: number;
  byFrequency: Record<string, number>;
}> {
  const all = await getAllSubscribers();
  
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
