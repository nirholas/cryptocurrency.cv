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
import { logger } from '@/lib/logger';

/**
 * Contact Form API
 *
 * Accepts contact form submissions and logs them.
 * In production, this would forward to an email service or ticketing system.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Message length validation
    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be under 5000 characters' },
        { status: 400 }
      );
    }

    // Log the contact submission (in production, send email or create ticket)
    logger.info('[Contact Form]', {
      name,
      email,
      subject: subject || 'general',
      messageLength: message.length,
    });

    return NextResponse.json(
      { success: true, message: 'Your message has been received. We will get back to you soon.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
