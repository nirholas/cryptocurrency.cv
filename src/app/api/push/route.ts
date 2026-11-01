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
import { db } from '@/lib/database';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';

// Database collection for push subscriptions
const PUSH_SUBSCRIPTIONS_COLLECTION = 'push_subscriptions';

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  topics: string[];
  createdAt: string;
  lastNotified?: string;
}

// Database-backed push subscription storage helper functions
async function getAllSubscriptions(): Promise<PushSubscriptionData[]> {
  try {
    const docs = await db.listDocuments<PushSubscriptionData>(PUSH_SUBSCRIPTIONS_COLLECTION, { limit: 1000 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get push subscriptions from database:', error);
    return [];
  }
}

async function getSubscriptionById(id: string): Promise<PushSubscriptionData | null> {
  try {
    const doc = await db.getDocument<PushSubscriptionData>(PUSH_SUBSCRIPTIONS_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveSubscription(subscription: PushSubscriptionData): Promise<void> {
  await db.saveDocument(PUSH_SUBSCRIPTIONS_COLLECTION, subscription.id, subscription, {
    topics: subscription.topics,
  });
}

async function deleteSubscription(id: string): Promise<boolean> {
  return db.deleteDocument(PUSH_SUBSCRIPTIONS_COLLECTION, id);
}

async function subscriptionExists(id: string): Promise<boolean> {
  const sub = await getSubscriptionById(id);
  return sub !== null;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * GET /api/push - Get VAPID public key for Web Push subscription
 */
export async function GET() {
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Push notifications not configured',
      message: 'Set VAPID_PUBLIC_KEY environment variable to enable push notifications',
    }, { status: 503 });
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';

  return NextResponse.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY,
    instructions: {
      step1: 'Use this public key to subscribe to push notifications in your service worker',
      step2: 'POST the subscription object to /api/push to register',
      step3: 'You will receive notifications when news matching your topics is published',
      example: {
        serviceWorkerCode: `
// In your service worker
self.addEventListener('push', function(event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
        `.trim(),
        subscriptionCode: `
// In your main JS
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  
  await fetch('${baseUrl}/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription,
      topics: ['bitcoin', 'ethereum', 'breaking']
    })
  });
}
        `.trim()
      }
    }
  });
}

/**
 * POST /api/push - Register a push subscription
 * 
 * Body:
 * {
 *   "subscription": { PushSubscription object from browser },
 *   "topics": ["bitcoin", "ethereum", "defi", "breaking"] // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { subscription, topics = ['breaking'] } = body;
    
    if (!subscription?.endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription',
        message: 'Missing subscription.endpoint'
      }, { status: 400 });
    }
    
    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription',
        message: 'Missing subscription keys (p256dh, auth)'
      }, { status: 400 });
    }
    
    // Validate topics
    const validTopics = ['bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'exchange', 'altcoin', 'breaking', 'all'];
    const filteredTopics = topics.filter((t: string) => validTopics.includes(t.toLowerCase()));
    
    if (filteredTopics.length === 0) {
      filteredTopics.push('breaking');
    }
    
    // Create subscription ID from endpoint hash
    const subscriptionId = await hashEndpoint(subscription.endpoint);
    
    // Store subscription in database
    const subscriptionData: PushSubscriptionData = {
      id: subscriptionId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      topics: filteredTopics,
      createdAt: new Date().toISOString()
    };
    
    await saveSubscription(subscriptionData);
    
    return NextResponse.json({
      success: true,
      message: 'Push subscription registered',
      subscriptionId,
      topics: filteredTopics,
      note: 'You will receive notifications for: ' + filteredTopics.join(', ')
    });
    
  } catch (error) {
    console.error('Push registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/push - Unsubscribe from push notifications
 * 
 * Body:
 * {
 *   "endpoint": "https://..." // The push subscription endpoint
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const jsonBody2 = await readJsonBody(request);
    if (!jsonBody2.ok) return jsonBody2.response;
    const body = jsonBody2.body;
    const { endpoint } = body;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Missing endpoint'
      }, { status: 400 });
    }
    
    const subscriptionId = await hashEndpoint(endpoint);
    
    const exists = await subscriptionExists(subscriptionId);
    if (exists) {
      await deleteSubscription(subscriptionId);
      return NextResponse.json({
        success: true,
        message: 'Unsubscribed from push notifications'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Subscription not found'
    }, { status: 404 });
    
  } catch (error) {
    console.error('push route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unsubscribe failed',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/push - Update subscription topics
 * 
 * Body:
 * {
 *   "endpoint": "https://...",
 *   "topics": ["bitcoin", "defi"]
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const jsonBody3 = await readJsonBody(request);
    if (!jsonBody3.ok) return jsonBody3.response;
    const body = jsonBody3.body;
    const { endpoint, topics } = body;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Missing endpoint'
      }, { status: 400 });
    }
    
    const subscriptionId = await hashEndpoint(endpoint);
    const subscription = await getSubscriptionById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 });
    }
    
    const validTopics = ['bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'exchange', 'altcoin', 'breaking', 'all'];
    const filteredTopics = (topics || []).filter((t: string) => validTopics.includes(t.toLowerCase()));
    
    subscription.topics = filteredTopics.length > 0 ? filteredTopics : ['breaking'];
    await saveSubscription(subscription);
    
    return NextResponse.json({
      success: true,
      message: 'Topics updated',
      topics: subscription.topics
    });
    
  } catch (error) {
    console.error('push route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Update failed',
    }, { status: 500 });
  }
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Utility: Hash endpoint for ID
async function hashEndpoint(endpoint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(endpoint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Helper for use by notification sender (e.g., cron job)
// Returns subscriptions from database filtered by topic
async function getSubscriptionsForTopic(topic: string): Promise<PushSubscriptionData[]> {
  const allSubs = await getAllSubscriptions();
  return allSubs.filter(sub => sub.topics.includes(topic) || sub.topics.includes('all'));
}

// Example notification payload helper
function createNotificationPayload(article: {
  title: string;
  source: string;
  link: string;
}): PushNotificationPayload {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';
  return {
    title: `📰 ${article.source}`,
    body: article.title,
    icon: `${siteUrl}/icon.png`,
    badge: `${siteUrl}/badge.png`,
    url: article.link,
    tag: 'crypto-news'
  };
}

// Export utility functions for external use
export { getSubscriptionsForTopic, createNotificationPayload };
