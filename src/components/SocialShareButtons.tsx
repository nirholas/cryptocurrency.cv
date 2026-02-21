'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

type Platform = 'twitter' | 'telegram' | 'reddit' | 'linkedin' | 'whatsapp' | 'copy';

interface ShareConfig {
  icon: string;
  label: string;
  color: string;
  hoverColor: string;
  getUrl: (url: string, title: string, hashtags?: string[]) => string;
}

const SHARE_CONFIGS: Record<Platform, ShareConfig> = {
  twitter: {
    icon: '𝕏',
    label: 'Twitter',
    color: 'bg-black dark:bg-white/10',
    hoverColor: 'hover:bg-gray-800 dark:hover:bg-white/20',
    getUrl: (url, title, hashtags) => {
      const tags = hashtags?.length ? `&hashtags=${hashtags.join(',')}` : '';
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}${tags}`;
    },
  },
  telegram: {
    icon: '✈️',
    label: 'Telegram',
    color: 'bg-[#0088cc]',
    hoverColor: 'hover:bg-[#006699]',
    getUrl: (url, title) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  reddit: {
    icon: '🔴',
    label: 'Reddit',
    color: 'bg-[#FF4500]',
    hoverColor: 'hover:bg-[#cc3700]',
    getUrl: (url, title) => 
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  linkedin: {
    icon: 'in',
    label: 'LinkedIn',
    color: 'bg-[#0077B5]',
    hoverColor: 'hover:bg-[#005885]',
    getUrl: (url, title) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  whatsapp: {
    icon: '📱',
    label: 'WhatsApp',
    color: 'bg-[#25D366]',
    hoverColor: 'hover:bg-[#1da851]',
    getUrl: (url, title) => 
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  copy: {
    icon: '📋',
    label: 'Copy',
    color: 'bg-gray-600 dark:bg-gray-700',
    hoverColor: 'hover:bg-gray-700 dark:hover:bg-gray-600',
    getUrl: () => '',
  },
};

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export function SocialShareButtons({
  url,
  title,
  description,
  hashtags = ['crypto', 'bitcoin', 'news'],
  className = '',
  size = 'md',
  showLabels = false,
  variant = 'default',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = useCallback(async (platform: Platform) => {
    setShareError(null);

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setShareError('Failed to copy');
      }
      return;
    }

    // Try native share first on mobile
    if (navigator.share && platform === 'twitter') {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        return;
      } catch {
        // Fall through to URL-based sharing
      }
    }

    // Open share URL
    const shareUrl = SHARE_CONFIGS[platform].getUrl(url, title, hashtags);
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  }, [url, title, description, hashtags]);

  const platforms: Platform[] = ['twitter', 'telegram', 'reddit', 'linkedin', 'whatsapp', 'copy'];

  const t = useTranslations('common');
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {platforms.map((platform) => {
        const config = SHARE_CONFIGS[platform];
        const isCopy = platform === 'copy';
        
        return (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={`
              ${sizeClasses[size]}
              ${variant === 'default' ? config.color : 'bg-transparent border border-gray-300 dark:border-gray-600'}
              ${config.hoverColor}
              rounded-full flex items-center justify-center
              text-white transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${isCopy && copied ? 'bg-green-500 hover:bg-green-600' : ''}
            `}
            title={isCopy && copied ? 'Copied!' : `Share on ${config.label}`}
            aria-label={`Share on ${config.label}`}
          >
            <span className={variant !== 'default' ? 'text-gray-700 dark:text-gray-300' : ''}>
              {isCopy && copied ? '✓' : config.icon}
            </span>
          </button>
        );
      })}
      
      {showLabels && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          {t('share')}
        </span>
      )}
      
      {shareError && (
        <span className="text-xs text-red-500 ml-2">{shareError}</span>
      )}
    </div>
  );
}

/**
 * Floating share bar for articles
 */
export function FloatingShareBar({
  url,
  title,
  show = true,
}: {
  url: string;
  title: string;
  show?: boolean;
}) {
  if (!show) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      <div className="flex flex-col gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <SocialShareButtons
          url={url}
          title={title}
          className="flex-col"
          size="md"
        />
      </div>
    </div>
  );
}

/**
 * Inline share bar for end of articles
 */
export function InlineShareBar({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-6 border-t border-b border-gray-200 dark:border-slate-700 my-8">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Share this article:
      </span>
      <SocialShareButtons
        url={url}
        title={title}
        size="md"
        hashtags={['crypto', 'news', 'bitcoin']}
      />
    </div>
  );
}

export default SocialShareButtons;
