/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * i18n Configuration
 * 
 * Internationalization configuration for Free Crypto News.
 * Used by translation scripts and validation.
 */

const { readTranslatedLocales } = require('./scripts/lib/translated-locales');

module.exports = {
  // Supported locales: every messages/<locale>.json on disk (the same source that drives
  // hreflang alternates and the sitemap), so this list can never drift from the files.
  locales: readTranslatedLocales(),

  // Priority locales for README/docs translation (BCP 47 language tags) - 42 languages
  docsLocales: [
    'en',      // English (default)
    'ar',      // Arabic (RTL)
    'bg',      // Bulgarian
    'bn',      // Bengali
    'cs',      // Czech
    'da',      // Danish
    'de',      // German
    'el',      // Greek
    'es',      // Spanish
    'fa',      // Persian/Farsi (RTL)
    'fi',      // Finnish
    'fr',      // French
    'he',      // Hebrew (RTL)
    'hi',      // Hindi
    'hr',      // Croatian
    'hu',      // Hungarian
    'id',      // Indonesian
    'it',      // Italian
    'ja',      // Japanese
    'ko',      // Korean
    'ms',      // Malay
    'nl',      // Dutch
    'no',      // Norwegian
    'pl',      // Polish
    'pt',      // Portuguese
    'ro',      // Romanian
    'ru',      // Russian
    'sk',      // Slovak
    'sl',      // Slovenian
    'sr',      // Serbian
    'sv',      // Swedish
    'sw',      // Swahili
    'ta',      // Tamil
    'te',      // Telugu
    'th',      // Thai
    'tl',      // Filipino/Tagalog
    'tr',      // Turkish
    'uk',      // Ukrainian
    'ur',      // Urdu (RTL)
    'vi',      // Vietnamese
    'zh-CN',   // Chinese Simplified
    'zh-TW',   // Chinese Traditional
  ],

  // Default/source locale
  defaultLocale: 'en',
  sourceLanguage: 'en',

  // RTL locales
  rtlLocales: ['ar', 'fa', 'he', 'ur'],

  // Locale metadata
  localeMetadata: {
    en: { name: 'English', nativeName: 'English', direction: 'ltr' },
    ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
    bg: { name: 'Bulgarian', nativeName: 'Български', direction: 'ltr' },
    bn: { name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
    cs: { name: 'Czech', nativeName: 'Čeština', direction: 'ltr' },
    da: { name: 'Danish', nativeName: 'Dansk', direction: 'ltr' },
    de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
    el: { name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr' },
    es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
    fa: { name: 'Persian', nativeName: 'فارسی', direction: 'rtl' },
    fi: { name: 'Finnish', nativeName: 'Suomi', direction: 'ltr' },
    fr: { name: 'French', nativeName: 'Français', direction: 'ltr' },
    he: { name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
    hr: { name: 'Croatian', nativeName: 'Hrvatski', direction: 'ltr' },
    hu: { name: 'Hungarian', nativeName: 'Magyar', direction: 'ltr' },
    id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
    it: { name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
    ja: { name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
    ko: { name: 'Korean', nativeName: '한국어', direction: 'ltr' },
    ms: { name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr' },
    nl: { name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
    no: { name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr' },
    pl: { name: 'Polish', nativeName: 'Polski', direction: 'ltr' },
    pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
    ro: { name: 'Romanian', nativeName: 'Română', direction: 'ltr' },
    ru: { name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
    sk: { name: 'Slovak', nativeName: 'Slovenčina', direction: 'ltr' },
    sl: { name: 'Slovenian', nativeName: 'Slovenščina', direction: 'ltr' },
    sr: { name: 'Serbian', nativeName: 'Српски', direction: 'ltr' },
    sv: { name: 'Swedish', nativeName: 'Svenska', direction: 'ltr' },
    sw: { name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr' },
    ta: { name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
    te: { name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
    th: { name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
    tl: { name: 'Filipino', nativeName: 'Filipino', direction: 'ltr' },
    tr: { name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
    uk: { name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr' },
    ur: { name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
    vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' },
    'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
    'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr' },
  },

  // Translation file paths
  translationFiles: {
    ui: 'messages/{locale}.json',
    readme: 'README.{locale}.md',
  },

  // AI translation settings
  modelName: 'gpt-4o-mini',
  temperature: 0.3,

  // Files/directories to exclude from translation
  exclude: [
    'node_modules',
    '.next',
    'dist',
    '.git',
    'coverage',
    'test-results',
    'playwright-report',
  ],

  // Files to translate (glob patterns)
  include: [
    'README.md',
    'docs/**/*.md',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
  ],

  // Translation rules
  rules: {
    // Keep these in English (don't translate)
    preserveTerms: [
      // Technical terms
      'API', 'JSON', 'SDK', 'HTTP', 'HTTPS', 'URL', 'REST', 'GraphQL',
      'WebSocket', 'RSS', 'Atom', 'OPML', 'PWA', 'MCP', 'SSE',
      // Crypto terms (keep in English for consistency)
      'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'TVL', 'DEX', 'CEX',
      'USDT', 'USDC', 'BTC', 'ETH', 'altcoin', 'stablecoin',
      // Brand names
      'GitHub', 'Vercel', 'Twitter', 'Discord', 'Telegram', 'Slack',
      'CoinDesk', 'CoinTelegraph', 'Blockworks', 'The Block', 'Decrypt',
      'CoinGecko', 'DeFiLlama', 'Groq', 'OpenAI', 'Claude', 'ChatGPT',
      // Project names
      'Free Crypto News', 'next-intl', 'Next.js', 'React', 'Node.js',
    ],
    // Preserve these patterns (regex)
    preservePatterns: [
      /\{[^}]+\}/g,           // Interpolation: {variable}
      /`[^`]+`/g,             // Inline code
      /```[\s\S]*?```/g,      // Code blocks
      /https?:\/\/[^\s)]+/g,  // URLs
      /\$[A-Z]+/g,            // Ticker symbols: $BTC
      /#[A-Z][a-zA-Z]+/g,     // Hashtags
      /@[a-zA-Z0-9_]+/g,      // Mentions
    ],
  },

  // Namespaces for UI translations
  namespaces: [
    'common',
    'nav',
    'home',
    'news',
    'article',
    'markets',
    'coin',
    'search',
    'bookmarks',
    'watchlist',
    'portfolio',
    'settings',
    'sources',
    'topics',
    'digest',
    'sentiment',
    'compare',
    'movers',
    'defi',
    'share',
    'footer',
    'errors',
    'pwa',
    'time',
    'a11y',
    'metadata',
  ],
};

