'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { locales, localeNames, localeRegions, type Locale } from '@/i18n/config';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal' | 'inline';
  showFlag?: boolean;
  showSearch?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showSearch = true,
  className = '',
}: LanguageSelectorProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname and add new one
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    router.push(`/${segments.join('/')}`);
    setIsOpen(false);
    setSearch('');
  };

  // Filter locales by search
  const filteredLocales = locales.filter((loc) => {
    if (!search) return true;
    const name = localeNames[loc].toLowerCase();
    const code = loc.toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  // Group by region
  const groupedLocales = Object.entries(localeRegions).map(([region, codes]) => ({
    region,
    locales: codes.filter((code) => filteredLocales.includes(code as Locale)) as Locale[],
  })).filter(group => group.locales.length > 0);

  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Select language"
        >
          <span className="font-medium">{localeNames[locale]}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
            {showSearch && (
              <div className="sticky top-0 p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="p-2">
              {search ? (
                // Flat list when searching
                <div className="grid grid-cols-2 gap-1">
                  {filteredLocales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        loc === locale
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{localeNames[loc]}</span>
                      {loc === locale && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                // Grouped by region
                groupedLocales.map(({ region, locales: regionLocales }) => (
                  <div key={region} className="mb-3">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {region}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {regionLocales.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleLocaleChange(loc)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            loc === locale
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className="truncate">{localeNames[loc]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
              {locales.length} languages available
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal variant for mobile
  if (variant === 'modal') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 ${className}`}
          aria-label="Select language"
        >
          <span>{localeNames[locale]}</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg max-h-[80vh] m-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Select Language</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {showSearch && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="overflow-auto max-h-[50vh] p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredLocales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      className={`flex items-center justify-center px-4 py-3 text-sm rounded-lg transition-colors ${
                        loc === locale
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
                {locales.length} languages • {filteredLocales.length} shown
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline variant
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {locales.slice(0, 10).map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            loc === locale
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
      {locales.length > 10 && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          +{locales.length - 10} more
        </button>
      )}
    </div>
  );
}

export default LanguageSelector;
