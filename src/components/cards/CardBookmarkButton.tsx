/**
 * CardBookmarkButton Component
 * Bookmark button specifically styled for cards (positioned absolutely)
 */

'use client';

import { useBookmarks } from '@/components/BookmarksProvider';

interface CardBookmarkButtonProps {
  article: {
    title: string;
    link: string;
    source: string;
    pubDate: string;
  };
  className?: string;
  size?: 'sm' | 'md';
}

export default function CardBookmarkButton({ article, className = '', size = 'sm' }: CardBookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.link);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (bookmarked) {
      removeBookmark(article.link);
    } else {
      addBookmark(article);
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'w-8 h-8 text-sm' 
    : 'w-10 h-10 text-base';

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200 
        backdrop-blur-sm shadow-sm hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-brand-500
        ${bookmarked 
          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/70' 
          : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
        }
        ${sizeClasses}
        ${className}
      `}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      aria-label={bookmarked ? 'Remove bookmark' : 'Save for later'}
      aria-pressed={bookmarked}
    >
      <svg 
        className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} 
        fill={bookmarked ? 'currentColor' : 'none'} 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
