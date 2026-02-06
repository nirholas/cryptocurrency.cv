/**
 * Alternate Links Component
 * Generates hreflang links for international SEO
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import { locales, type Locale } from '@/i18n/config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

interface AlternateLinksProps {
  currentLocale: string;
  currentPath: string;
}

/**
 * Maps locales to their hreflang values where they differ from the locale code
 * hreflang uses language-region format (e.g., zh-CN, zh-TW)
 * Most locales map directly to themselves, only special cases are listed here
 */
const hreflangOverrides: Partial<Record<Locale, string>> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'pt-BR': 'pt-BR',
};

/**
 * Get the hreflang value for a locale
 * Falls back to the locale code if no override exists
 */
function getHreflang(locale: Locale): string {
  return hreflangOverrides[locale] || locale;
}

/**
 * Generates hreflang alternate links for all supported locales
 * This helps search engines serve the correct language version
 */
export function AlternateLinks({ currentLocale, currentPath }: AlternateLinksProps) {
  // Remove leading slash if present
  const cleanPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
  
  return (
    <>
      {locales.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={getHreflang(locale)}
          href={`${BASE_URL}/${locale}${cleanPath ? `/${cleanPath}` : ''}`}
        />
      ))}
      {/* x-default for language selector page or default version */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}/en${cleanPath ? `/${cleanPath}` : ''}`}
      />
    </>
  );
}

/**
 * Generates metadata alternates for Next.js generateMetadata
 * Use this in page-level generateMetadata functions
 */
export function getAlternateLanguages(path: string = '') {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const languages: Record<string, string> = {};
  
  locales.forEach((locale) => {
    const hreflang = getHreflang(locale);
    languages[hreflang] = `${BASE_URL}/${locale}${cleanPath ? `/${cleanPath}` : ''}`;
  });
  
  // Add x-default
  languages['x-default'] = `${BASE_URL}/en${cleanPath ? `/${cleanPath}` : ''}`;
  
  return {
    canonical: `${BASE_URL}/${cleanPath}`,
    languages,
  };
}
