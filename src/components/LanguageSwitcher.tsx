'use client';

/**
 * Language Switcher Component
 * Allows users to change the application language
 */

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  /** Visual variant of the switcher */
  variant?: 'dropdown' | 'compact' | 'full';
  /** Additional CSS classes */
  className?: string;
}

export function LanguageSwitcher({ variant = 'dropdown', className = '' }: LanguageSwitcherProps) {
  const t = useTranslations('settings');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale });
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={() => {
          // Cycle through locales
          const currentIndex = locales.indexOf(locale);
          const nextIndex = (currentIndex + 1) % locales.length;
          handleChange(locales[nextIndex]);
        }}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        aria-label={`${locale.toUpperCase()}: ${t('selectLanguage')}`}
      >
        <span className="text-lg" aria-hidden="true">🌐</span>
        <span className="uppercase">{locale}</span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ${className}`}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleChange(loc)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              loc === locale
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('selectLanguage')}
      </label>
      <div className="relative">
        <select
          id="language-select"
          value={locale}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
        >
          {locales.map((loc) => (
            <option key={loc} value={loc} className="bg-white dark:bg-gray-900">
              {localeNames[loc]}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className="h-4 w-4 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
