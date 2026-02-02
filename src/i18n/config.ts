/**
 * i18n Configuration
 * Defines supported locales and default locale for next-intl
 * Supports 100+ languages for maximum global reach
 */

export const locales = [
  'en',      // English (default)
  'af',      // Afrikaans
  'am',      // Amharic
  'ar',      // Arabic (RTL)
  'az',      // Azerbaijani
  'be',      // Belarusian
  'bg',      // Bulgarian
  'bn',      // Bengali
  'bs',      // Bosnian
  'ca',      // Catalan
  'ceb',     // Cebuano
  'cs',      // Czech
  'cy',      // Welsh
  'da',      // Danish
  'de',      // German
  'el',      // Greek
  'eo',      // Esperanto
  'es',      // Spanish
  'et',      // Estonian
  'eu',      // Basque
  'fa',      // Persian (RTL)
  'fi',      // Finnish
  'fr',      // French
  'fy',      // Frisian
  'ga',      // Irish
  'gd',      // Scottish Gaelic
  'gl',      // Galician
  'gu',      // Gujarati
  'ha',      // Hausa
  'he',      // Hebrew (RTL)
  'hi',      // Hindi
  'hr',      // Croatian
  'hu',      // Hungarian
  'hy',      // Armenian
  'id',      // Indonesian
  'ig',      // Igbo
  'is',      // Icelandic
  'it',      // Italian
  'ja',      // Japanese
  'jv',      // Javanese
  'ka',      // Georgian
  'kk',      // Kazakh
  'km',      // Khmer
  'kn',      // Kannada
  'ko',      // Korean
  'ku',      // Kurdish (RTL)
  'ky',      // Kyrgyz
  'la',      // Latin
  'lb',      // Luxembourgish
  'lo',      // Lao
  'lt',      // Lithuanian
  'lv',      // Latvian
  'mg',      // Malagasy
  'mk',      // Macedonian
  'ml',      // Malayalam
  'mn',      // Mongolian
  'mr',      // Marathi
  'ms',      // Malay
  'mt',      // Maltese
  'my',      // Burmese
  'ne',      // Nepali
  'nl',      // Dutch
  'no',      // Norwegian
  'or',      // Odia
  'pa',      // Punjabi
  'pl',      // Polish
  'ps',      // Pashto (RTL)
  'pt',      // Portuguese
  'pt-BR',   // Portuguese (Brazilian)
  'ro',      // Romanian
  'ru',      // Russian
  'rw',      // Kinyarwanda
  'si',      // Sinhala
  'sk',      // Slovak
  'sl',      // Slovenian
  'so',      // Somali
  'sq',      // Albanian
  'sr',      // Serbian
  'su',      // Sundanese
  'sv',      // Swedish
  'sw',      // Swahili
  'ta',      // Tamil
  'te',      // Telugu
  'tg',      // Tajik
  'th',      // Thai
  'tk',      // Turkmen
  'tl',      // Filipino
  'tr',      // Turkish
  'uk',      // Ukrainian
  'ur',      // Urdu (RTL)
  'uz',      // Uzbek
  'vi',      // Vietnamese
  'xh',      // Xhosa
  'yi',      // Yiddish (RTL)
  'yo',      // Yoruba
  'zh-CN',   // Chinese Simplified
  'zh-TW',   // Chinese Traditional
  'zu',      // Zulu
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'af': 'Afrikaans',
  'am': 'አማርኛ',
  'ar': 'العربية',
  'az': 'Azərbaycan',
  'be': 'Беларуская',
  'bg': 'Български',
  'bn': 'বাংলা',
  'bs': 'Bosanski',
  'ca': 'Català',
  'ceb': 'Cebuano',
  'cs': 'Čeština',
  'cy': 'Cymraeg',
  'da': 'Dansk',
  'de': 'Deutsch',
  'el': 'Ελληνικά',
  'eo': 'Esperanto',
  'es': 'Español',
  'et': 'Eesti',
  'eu': 'Euskara',
  'fa': 'فارسی',
  'fi': 'Suomi',
  'fr': 'Français',
  'fy': 'Frysk',
  'ga': 'Gaeilge',
  'gd': 'Gàidhlig',
  'gl': 'Galego',
  'gu': 'ગુજરાતી',
  'ha': 'Hausa',
  'he': 'עברית',
  'hi': 'हिन्दी',
  'hr': 'Hrvatski',
  'hu': 'Magyar',
  'hy': 'Հայdelays',
  'id': 'Indonesia',
  'ig': 'Igbo',
  'is': 'Íslenska',
  'it': 'Italiano',
  'ja': '日本語',
  'jv': 'Basa Jawa',
  'ka': 'ქართული',
  'kk': 'Қазақша',
  'km': 'ខ្មែរ',
  'kn': 'ಕನ್ನಡ',
  'ko': '한국어',
  'ku': 'کوردی',
  'ky': 'Кыргызча',
  'la': 'Latina',
  'lb': 'Lëtzebuergesch',
  'lo': 'ລາວ',
  'lt': 'Lietuvių',
  'lv': 'Latviešu',
  'mg': 'Malagasy',
  'mk': 'Македонски',
  'ml': 'മലയാളം',
  'mn': 'Монгол',
  'mr': 'मराठी',
  'ms': 'Melayu',
  'mt': 'Malti',
  'my': 'မြန်မာ',
  'ne': 'नेपाली',
  'nl': 'Nederlands',
  'no': 'Norsk',
  'or': 'ଓଡ଼ିଆ',
  'pa': 'ਪੰਜਾਬੀ',
  'pl': 'Polski',
  'ps': 'پښتو',
  'pt': 'Português',
  'pt-BR': 'Português (Brasil)',
  'ro': 'Română',
  'ru': 'Русский',
  'rw': 'Kinyarwanda',
  'si': 'සිංහල',
  'sk': 'Slovenčina',
  'sl': 'Slovenščina',
  'so': 'Soomaali',
  'sq': 'Shqip',
  'sr': 'Српски',
  'su': 'Basa Sunda',
  'sv': 'Svenska',
  'sw': 'Kiswahili',
  'ta': 'தமிழ்',
  'te': 'తెలుగు',
  'tg': 'Тоҷикӣ',
  'th': 'ไทย',
  'tk': 'Türkmençe',
  'tl': 'Filipino',
  'tr': 'Türkçe',
  'uk': 'Українська',
  'ur': 'اردو',
  'uz': "O'zbek",
  'vi': 'Tiếng Việt',
  'xh': 'isiXhosa',
  'yi': 'ייִדיש',
  'yo': 'Yorùbá',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'zu': 'isiZulu',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar', 'fa', 'he', 'ku', 'ps', 'ur', 'yi'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Get RTL languages array
export function getRtlLanguages(): Locale[] {
  return rtlLocales;
}

// Get locale direction
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

// Locale detection
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0] as Locale;
  
  if (locales.includes(potentialLocale)) {
    return potentialLocale;
  }
  
  return defaultLocale;
}

// Get locale from browser
export function getLocaleFromBrowser(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale;
  
  const browserLang = navigator.language.split('-')[0];
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  // Check for regional variants
  const fullLang = navigator.language as Locale;
  if (locales.includes(fullLang)) {
    return fullLang;
  }
  
  return defaultLocale;
}

// Language regions for grouping in UI
export const localeRegions = {
  'Western European': ['en', 'de', 'fr', 'es', 'pt', 'pt-BR', 'it', 'nl', 'da', 'sv', 'no', 'fi', 'is'],
  'Eastern European': ['ru', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'sr', 'bs', 'mk', 'uk', 'be', 'lt', 'lv', 'et'],
  'Middle Eastern': ['ar', 'fa', 'he', 'tr', 'ku', 'ps'],
  'South Asian': ['hi', 'bn', 'pa', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'or', 'ne', 'si', 'ur'],
  'East Asian': ['zh-CN', 'zh-TW', 'ja', 'ko', 'mn'],
  'Southeast Asian': ['vi', 'th', 'id', 'ms', 'tl', 'my', 'km', 'lo', 'jv', 'su', 'ceb'],
  'Central Asian': ['kk', 'uz', 'tg', 'ky', 'tk', 'az'],
  'African': ['sw', 'am', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'mg', 'rw', 'so'],
  'Celtic & Regional': ['ga', 'gd', 'cy', 'eu', 'ca', 'gl', 'lb', 'fy', 'mt'],
  'Other': ['eo', 'la', 'hy', 'ka', 'sq', 'yi'],
} as const;

// Total language count
export const totalLanguages = locales.length;
