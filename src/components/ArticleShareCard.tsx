/**
 * Article Share Card - Share buttons with "via cryptocurrency.cv" attribution
 * Client component for clipboard functionality
 */
'use client';

import { useState } from 'react';

interface ArticleShareCardProps {
  title: string;
  url: string;
}

export default function ArticleShareCard({ title, url }: ArticleShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title} — via cryptocurrency.cv`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n${url}\n\nvia cryptocurrency.cv`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = `${title}\n${url}\n\nvia cryptocurrency.cv`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title} — via cryptocurrency.cv`,
          url,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
      <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">📤 Share</h2>
      
      <div className="flex flex-wrap gap-2">
        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg text-center text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition"
        >
          𝕏 Post
        </a>
        
        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-[#2AABEE] text-white rounded-lg text-center text-sm font-medium hover:bg-[#229ED9] transition"
        >
          Telegram
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {/* Reddit */}
        <a
          href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-[#FF4500] text-white rounded-lg text-center text-sm font-medium hover:bg-[#E03D00] transition"
        >
          Reddit
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-[#0A66C2] text-white rounded-lg text-center text-sm font-medium hover:bg-[#004182] transition"
        >
          LinkedIn
        </a>
      </div>

      {/* Native Share (mobile) */}
      {'share' in (typeof navigator !== 'undefined' ? navigator : {}) && (
        <button
          onClick={handleNativeShare}
          className="w-full mt-2 py-2.5 px-4 bg-gray-900 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-slate-500 transition"
        >
          📱 Share...
        </button>
      )}

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="w-full mt-2 py-2.5 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition"
      >
        {copied ? '✅ Copied!' : '📋 Copy Link'}
      </button>

      {/* Attribution */}
      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-3 text-center">
        shared via <span className="font-medium">cryptocurrency.cv</span>
      </p>
    </div>
  );
}
