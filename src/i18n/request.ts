/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * i18n Request Configuration
 * Server-side locale and messages configuration for next-intl
 */

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

// Cache for loaded messages
const messagesCache: Record<string, Record<string, unknown>> = {};

// Load messages with fallback to English
async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  // Check cache first
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }
  
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    messagesCache[locale] = messages;
    return messages;
  } catch {
    console.warn(`Failed to load messages for locale "${locale}", falling back to English`);
    
    // Load English as fallback
    if (locale !== defaultLocale) {
      if (!messagesCache[defaultLocale]) {
        messagesCache[defaultLocale] = (await import(`../../messages/${defaultLocale}.json`)).default;
      }
      return messagesCache[defaultLocale];
    }
    
    // If even English fails, return empty object
    console.error('Failed to load default locale messages');
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically comes from the middleware
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
  };
});
