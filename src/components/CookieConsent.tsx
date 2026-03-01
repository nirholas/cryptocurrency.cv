'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Cookie Consent Banner
 * 
 * GDPR/CCPA-compliant cookie consent banner.
 * Uses localStorage to remember user's choice.
 * Shows only essential cookies since we don't use tracking cookies.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500"
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-4xl mx-auto bg-gray-900 dark:bg-slate-800 border border-gray-700 dark:border-slate-600 rounded-2xl shadow-2xl p-6 md:flex md:items-center md:gap-6">
        <div className="flex-1 mb-4 md:mb-0">
          <p id="cookie-consent-description" className="text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold text-white">🍪 We value your privacy.</span>{' '}
            We use only essential cookies for security and functionality — no tracking, no ads, no third-party cookies.
            Your bookmarks, watchlist, and preferences stay in your browser.{' '}
            <Link href="/privacy" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
