/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';
import { Home, BarChart3, Search, Bookmark, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useBookmarks } from '@/components/BookmarksProvider';
import { useAlerts } from '@/components/alerts';
import { useHapticFeedback, useScrollDirection } from '@/hooks/useMobile';

/* ─── Navigation items ─── */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional badge count accessor key */
  badge?: 'bookmarks' | 'alerts';
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'home', icon: Home },
  { href: '/markets', label: 'markets', icon: BarChart3 },
  { href: '/search', label: 'search', icon: Search },
  { href: '/bookmarks', label: 'bookmarks', icon: Bookmark, badge: 'bookmarks' },
  { href: '/settings', label: 'more', icon: MoreHorizontal, badge: 'alerts' },
];

/* ─── Component ─── */

export function BottomNav() {
  const t = useTranslations('bottomNav');
  const pathname = usePathname();
  const { bookmarks } = useBookmarks();
  const { triggered } = useAlerts();
  const haptic = useHapticFeedback();
  const scrollDirection = useScrollDirection();
  const [isHidden, setIsHidden] = useState(false);
  const lastTapRef = useRef<Record<string, number>>({});

  /* Smart hide on scroll down, show on scroll up */
  useEffect(() => {
    setIsHidden(scrollDirection === 'down');
  }, [scrollDirection]);

  /* Badge counts */
  const getBadge = useCallback(
    (key?: 'bookmarks' | 'alerts'): number => {
      if (!key) return 0;
      if (key === 'bookmarks') return bookmarks.length;
      if (key === 'alerts') return triggered.length;
      return 0;
    },
    [bookmarks.length, triggered.length],
  );

  const handleTap = useCallback(
    (href: string) => {
      haptic('light');
      // Double-tap to scroll to top
      const now = Date.now();
      const lastTap = lastTapRef.current[href] ?? 0;
      if (now - lastTap < 300 && href === pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      lastTapRef.current[href] = now;
    },
    [haptic, pathname],
  );

  return (
    <nav
      className={cn(
        'fixed right-0 bottom-0 left-0 z-40',
        'border-border border-t bg-(--color-surface)/95 backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)] md:hidden',
        'transition-transform duration-300 ease-in-out',
        isHidden ? 'translate-y-full' : 'translate-y-0',
      )}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const count = getBadge(badge);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => handleTap(href)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[10px] transition-all duration-200',
                  isActive ? 'text-accent' : 'text-text-tertiary active:scale-90',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={count > 0 ? `${t(label)} (${count})` : t(label)}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span
                    className="bg-accent absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                    aria-hidden="true"
                  />
                )}

                <span className="relative">
                  <Icon className={cn('size-5', isActive && 'stroke-[2.5px]')} aria-hidden="true" />
                  {/* Badge */}
                  {count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                      aria-hidden="true"
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                <span className={cn('leading-none', isActive && 'font-semibold')}>{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
