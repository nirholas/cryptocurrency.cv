/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { TRANSLATED_LOCALES, defaultLocale } from "@/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cryptocurrency.cv";

/**
 * Returns alternate language URLs for SEO metadata.
 * Used by seo.ts for generating hreflang alternates.
 *
 * Only locales with a real translation file are emitted (TRANSLATED_LOCALES). Routing
 * still serves every locale in `locales`, but advertising an untranslated locale as an
 * alternate points crawlers at duplicate English pages, so those are left out.
 */
export function getAlternateLanguages(path: string): {
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  languages["x-default"] = `${BASE_URL}/${defaultLocale}${suffix}`;
  for (const locale of TRANSLATED_LOCALES) {
    languages[locale] = `${BASE_URL}/${locale}${suffix}`;
  }
  return { languages };
}
