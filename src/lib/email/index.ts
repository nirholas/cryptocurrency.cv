/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Email Service — Singleton + Send Helpers
 *
 * Provides a single `sendEmail()` entry-point.
 * In production, uses Resend. In development, falls back to ConsoleProvider.
 */

import {
  type EmailProvider,
  type SendEmailParams,
  ResendProvider,
  ConsoleProvider,
} from './provider';

export type { SendEmailParams } from './provider';
export type { EmailProvider } from './provider';

let _provider: EmailProvider | null = null;

/**
 * Returns the configured email provider singleton.
 * - Uses ResendProvider when RESEND_API_KEY is set
 * - Falls back to ConsoleProvider otherwise
 */
export function getEmailProvider(): EmailProvider {
  if (_provider) return _provider;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    _provider = new ResendProvider(apiKey);
  } else {
    _provider = new ConsoleProvider();
  }

  return _provider;
}

/**
 * Send an email using the configured provider.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const provider = getEmailProvider();
  return provider.send(params);
}

// Re-export templates for convenience
export {
  magicLinkEmail,
  notificationDigestEmail,
  alertTriggeredEmail,
  welcomeEmail,
  emailVerificationEmail,
} from './templates';
