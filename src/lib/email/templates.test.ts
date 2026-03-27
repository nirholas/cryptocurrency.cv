/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect } from 'vitest';
import {
  magicLinkEmail,
  notificationDigestEmail,
  alertTriggeredEmail,
  welcomeEmail,
  emailVerificationEmail,
} from './templates';

describe('Email Templates', () => {
  describe('magicLinkEmail', () => {
    it('returns subject, html with link, and text fallback', () => {
      const result = magicLinkEmail('https://example.com/auth?token=abc');
      expect(result.subject).toContain('Sign in');
      expect(result.html).toContain('https://example.com/auth?token=abc');
      expect(result.html).toContain('Sign In');
      expect(result.text).toContain('https://example.com/auth?token=abc');
    });
  });

  describe('notificationDigestEmail', () => {
    it('renders article list and unsubscribe link', () => {
      const result = notificationDigestEmail(
        [
          { title: 'BTC hits 100k', link: 'https://a.com', source: 'CoinDesk', timeAgo: '2h ago' },
          {
            title: 'ETH update',
            link: 'https://b.com',
            source: 'Decrypt',
            description: 'Some desc',
            timeAgo: '5h ago',
          },
        ],
        'https://example.com/unsub',
      );
      expect(result.subject).toContain('2 updates');
      expect(result.html).toContain('BTC hits 100k');
      expect(result.html).toContain('ETH update');
      expect(result.html).toContain('Some desc');
      expect(result.html).toContain('https://example.com/unsub');
      expect(result.text).toContain('BTC hits 100k');
    });

    it('handles singular count', () => {
      const result = notificationDigestEmail(
        [{ title: 'Solo article', link: 'https://a.com', source: 'Test', timeAgo: '1h ago' }],
        'https://unsub.com',
      );
      expect(result.subject).toContain('1 update');
      expect(result.subject).not.toContain('1 updates');
    });
  });

  describe('alertTriggeredEmail', () => {
    it('renders alert data with up emoji', () => {
      const result = alertTriggeredEmail({
        ticker: 'BTC',
        alertType: 'price',
        condition: 'above',
        threshold: 100000,
        currentValue: 105000,
        direction: 'up',
      });
      expect(result.subject).toContain('BTC');
      expect(result.subject).toContain('🟢');
      expect(result.html).toContain('BTC');
      expect(result.html).toContain('$105,000');
    });

    it('renders down emoji', () => {
      const result = alertTriggeredEmail({
        ticker: 'ETH',
        alertType: 'price',
        condition: 'below',
        threshold: 2000,
        currentValue: 1900,
        direction: 'down',
      });
      expect(result.subject).toContain('🔴');
    });
  });

  describe('welcomeEmail', () => {
    it('includes name in greeting', () => {
      const result = welcomeEmail('Alice');
      expect(result.subject).toContain('Welcome');
      expect(result.html).toContain('Alice');
      expect(result.text).toContain('Alice');
    });

    it('uses fallback when name is empty', () => {
      const result = welcomeEmail('');
      expect(result.html).toContain('there');
    });
  });

  describe('emailVerificationEmail', () => {
    it('includes verification URL', () => {
      const result = emailVerificationEmail('https://example.com/verify?token=xyz');
      expect(result.subject).toContain('Verify');
      expect(result.html).toContain('https://example.com/verify?token=xyz');
      expect(result.text).toContain('https://example.com/verify?token=xyz');
    });
  });
});
