/**
 * @fileoverview Newsletter Subscription API
 * 
 * Handles newsletter subscriptions with email validation and storage.
 * In production, integrate with services like Buttondown, ConvertKit, or Mailchimp.
 * 
 * @module api/newsletter/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface SubscriptionRequest {
  email: string;
}

interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscribed?: boolean;
}

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting: Track subscription attempts (in production, use Redis or similar)
const subscriptionAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, data] of subscriptionAttempts.entries()) {
    if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
      subscriptionAttempts.delete(ip);
    }
  }
}

/**
 * Check if IP is rate limited
 */
function isRateLimited(ip: string): boolean {
  cleanupRateLimits();
  const now = Date.now();
  const attempts = subscriptionAttempts.get(ip);
  
  if (!attempts) {
    subscriptionAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    subscriptionAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return false;
}

/**
 * POST /api/newsletter/subscribe
 * 
 * Subscribe an email to the newsletter
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many subscription attempts. Please try again later.',
        } as SubscriptionResponse,
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json() as SubscriptionRequest;
    const { email } = body;
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        } as SubscriptionResponse,
        { status: 400 }
      );
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email address',
        } as SubscriptionResponse,
        { status: 400 }
      );
    }
    
    // Check for disposable email domains (basic check)
    const disposableDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com'];
    const emailDomain = normalizedEmail.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please use a permanent email address',
        } as SubscriptionResponse,
        { status: 400 }
      );
    }
    
    // Try external newsletter service if configured
    const buttondownApiKey = process.env.BUTTONDOWN_API_KEY;
    const convertKitApiKey = process.env.CONVERTKIT_API_KEY;
    const convertKitFormId = process.env.CONVERTKIT_FORM_ID;
    const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
    const mailchimpListId = process.env.MAILCHIMP_LIST_ID;
    
    // Try Buttondown
    if (buttondownApiKey) {
      try {
        const response = await fetch('https://api.buttondown.email/v1/subscribers', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${buttondownApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            tags: ['crypto-news', 'website-signup'],
          }),
        });
        
        if (response.ok || response.status === 409) {
          // 409 means already subscribed, which is also a success
          return NextResponse.json({
            success: true,
            message: response.status === 409 
              ? 'You\'re already subscribed!' 
              : 'Successfully subscribed! Check your email to confirm.',
            subscribed: true,
          } as SubscriptionResponse);
        }
      } catch (error) {
        console.error('Buttondown subscription error:', error);
      }
    }
    
    // Try ConvertKit
    if (convertKitApiKey && convertKitFormId) {
      try {
        const response = await fetch(
          `https://api.convertkit.com/v3/forms/${convertKitFormId}/subscribe`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: convertKitApiKey,
              email: normalizedEmail,
              tags: ['crypto-news'],
            }),
          }
        );
        
        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: 'Successfully subscribed! Check your email to confirm.',
            subscribed: true,
          } as SubscriptionResponse);
        }
      } catch (error) {
        console.error('ConvertKit subscription error:', error);
      }
    }
    
    // Try Mailchimp
    if (mailchimpApiKey && mailchimpListId) {
      try {
        const dc = mailchimpApiKey.split('-')[1]; // Extract data center
        const response = await fetch(
          `https://${dc}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mailchimpApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email_address: normalizedEmail,
              status: 'pending', // Double opt-in
              tags: ['crypto-news', 'website'],
            }),
          }
        );
        
        if (response.ok || response.status === 400) {
          const data = await response.json();
          // 400 with "Member Exists" is also a success
          if (response.ok || data.title === 'Member Exists') {
            return NextResponse.json({
              success: true,
              message: response.status === 400 
                ? 'You\'re already subscribed!' 
                : 'Successfully subscribed! Check your email to confirm.',
              subscribed: true,
            } as SubscriptionResponse);
          }
        }
      } catch (error) {
        console.error('Mailchimp subscription error:', error);
      }
    }
    
    // If no external service is configured, log and accept the subscription
    // In production, you might want to store this in a database
    console.log(`Newsletter subscription: ${normalizedEmail}`);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Thank you for joining.',
      subscribed: true,
    } as SubscriptionResponse);
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      } as SubscriptionResponse,
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
