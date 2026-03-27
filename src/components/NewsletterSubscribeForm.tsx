/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NewsletterSubscribeFormProps {
  newsletterIds: string[];
  compact?: boolean;
}

export default function NewsletterSubscribeForm({
  newsletterIds,
  compact = false,
}: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletters: newsletterIds }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || "You're subscribed! Check your inbox for confirmation.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}
    >
      <div className="relative flex-1">
        <Mail className="text-text-tertiary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="your@email.com"
          required
          className={cn(
            'border-border w-full rounded-lg border bg-(--color-surface) pr-4 pl-10 text-sm',
            'focus:ring-accent focus:border-transparent focus:ring-2 focus:outline-none',
            'placeholder:text-text-tertiary',
            compact ? 'h-9' : 'h-10',
          )}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={status === 'loading'}
        className={compact ? 'h-9 px-4 text-sm' : 'h-10 px-5'}
      >
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
      </Button>
      {status === 'error' && <p className="mt-1 text-xs text-red-500">{message}</p>}
    </form>
  );
}
