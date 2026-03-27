/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { locales } from "@/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cryptocurrency.cv";

/**
 * Returns alternate language URLs for SEO metadata.
 * Used by seo.ts for generating hreflang alternates.
 */
export function getAlternateLanguages(path: string): {
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${BASE_URL}/${locale}${path ? `/${path}` : ""}`;
  }
  return { languages };
}
