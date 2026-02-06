'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

interface NewsletterFormProps {
  variant?: 'inline' | 'card' | 'banner';
}

export function NewsletterForm({ variant = 'card' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency, action: 'subscribe' }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your email to confirm.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  if (variant === 'banner') {
    if (!showBanner) return null;
    
    return (
      <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">Get daily crypto news in your inbox</span>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-3 py-1.5 rounded text-gray-900 text-sm w-48"
              disabled={status === 'loading' || status === 'success'}
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="px-4 py-1.5 bg-white text-gray-900 rounded font-medium text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'success' ? '✓' : 'Subscribe'}
            </button>
          </form>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'success' ? 'Subscribed!' : 'Subscribe'}
        </button>
      </form>
    );
  }

  // Card variant (default)
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Mail className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Crypto News Digest</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Stay updated with the latest news</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="Enter your email address"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              disabled={status === 'loading'}
            />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
            {['daily', 'weekly'].map((freq) => (
              <label key={freq} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={frequency === freq}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="text-gray-900 dark:text-white focus:ring-gray-500"
                />
                <span className="capitalize">{freq}</span>
              </label>
            ))}
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-white hover:bg-gray-100 text-black rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            Subscribe for Free
          </button>

          <p className="text-xs text-gray-500 text-center">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </form>
      )}
    </div>
  );
}
