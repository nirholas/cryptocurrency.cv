#!/usr/bin/env bun
/**
 * Bulk i18n translator using Google Gemini API.
 *
 * Usage:
 *   GOOGLE_API_KEYS="key1,key2,..." bun run scripts/i18n/translate.ts
 *   GOOGLE_API_KEYS="key1,key2,..." bun run scripts/i18n/translate.ts --locale=zh-CN
 *   GOOGLE_API_KEYS="key1,key2,..." bun run scripts/i18n/translate.ts --dry-run
 *   GOOGLE_API_KEYS="key1,key2,..." bun run scripts/i18n/translate.ts --concurrency=129
 *
 * Reads from: messages/en.json
 * Writes to:  messages/{locale}.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dir, '../..');
const MESSAGES_DIR = resolve(ROOT, 'messages');
const SOURCE_FILE = resolve(MESSAGES_DIR, 'en.json');
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-2.5-flash';
const BATCH_SIZE = 20; // keys per batch
const MAX_RETRIES = 5;

// 41 target locales from .i18nrc.js
const TARGET_LOCALES = [
  'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fa', 'fi',
  'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms',
  'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv',
  'sw', 'ta', 'te', 'th', 'tl', 'tr', 'uk', 'ur', 'vi', 'zh-CN', 'zh-TW',
];

// Locale display names for better prompts
const LOCALE_NAMES: Record<string, string> = {
  ar: 'Arabic', bg: 'Bulgarian', bn: 'Bengali', cs: 'Czech', da: 'Danish',
  de: 'German', el: 'Greek', es: 'Spanish', fa: 'Persian', fi: 'Finnish',
  fr: 'French', he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian',
  id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay',
  nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ro: 'Romanian',
  ru: 'Russian', sk: 'Slovak', sl: 'Slovenian', sr: 'Serbian', sv: 'Swedish',
  sw: 'Swahili', ta: 'Tamil', te: 'Telugu', th: 'Thai', tl: 'Filipino',
  tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese',
  'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese',
};

// Terms to keep in English
const PRESERVE_TERMS = [
  'API', 'JSON', 'SDK', 'HTTP', 'HTTPS', 'URL', 'REST', 'GraphQL',
  'WebSocket', 'RSS', 'Atom', 'OPML', 'PWA', 'MCP', 'SSE',
  'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'TVL', 'DEX', 'CEX',
  'USDT', 'USDC', 'BTC', 'ETH', 'altcoin', 'stablecoin',
  'GitHub', 'Vercel', 'CoinDesk', 'CoinTelegraph', 'Blockworks',
  'CoinGecko', 'DeFiLlama', 'Groq', 'OpenAI', 'Claude', 'ChatGPT',
  'Free Crypto News', 'next-intl', 'Next.js', 'React', 'Node.js',
];

// ─── Arg parsing ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const localeFilter = args.find(a => a.startsWith('--locale='))?.split('=')[1]?.split(',');
const targetLocales = localeFilter ?? TARGET_LOCALES;

// ─── API keys ──────────────────────────────────────────────────────────
const rawKeys = process.env.GOOGLE_API_KEYS ?? process.env.GOOGLE_API_KEY ?? '';
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

if (apiKeys.length === 0) {
  console.error('Error: set GOOGLE_API_KEYS="key1,key2,..."');
  process.exit(1);
}

console.log(`Keys: ${apiKeys.length} | Locales: ${targetLocales.join(', ')} | Model: ${MODEL}`);

// ─── Load source ───────────────────────────────────────────────────────
if (!existsSync(SOURCE_FILE)) {
  console.error(`Source file not found: ${SOURCE_FILE}`);
  process.exit(1);
}

const source: Record<string, any> = JSON.parse(readFileSync(SOURCE_FILE, 'utf8'));

// Flatten nested JSON to dot-notation keys
function flatten(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path));
    } else if (typeof value === 'string') {
      result[path] = value;
    }
  }
  return result;
}

// Unflatten dot-notation keys back to nested JSON
function unflatten(obj: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

const flatSource = flatten(source);
const sourceKeyCount = Object.keys(flatSource).length;

if (sourceKeyCount === 0) {
  console.error('Source file has no translatable string keys.');
  process.exit(1);
}

console.log(`Source keys: ${sourceKeyCount}`);

// ─── Key pool ──────────────────────────────────────────────────────────
let keyIndex = 0;
const deadKeys = new Set<string>();

function getKey(): string {
  const alive = apiKeys.filter(k => !deadKeys.has(k));
  if (alive.length === 0) throw new Error('All API keys exhausted');
  const key = alive[keyIndex % alive.length];
  keyIndex++;
  return key;
}

// ─── Translate a batch ─────────────────────────────────────────────────
async function translateBatch(
  batch: Record<string, string>,
  locale: string,
): Promise<Record<string, string>> {
  const localeName = LOCALE_NAMES[locale] ?? locale;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const key = getKey();
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a professional translator for a cryptocurrency news application called "Free Crypto News". Translate the JSON values from English to ${localeName} (${locale}). Return ONLY valid JSON with the exact same keys.

Rules:
- Preserve {variables} and {{variables}} exactly as-is
- Keep these terms in English: ${PRESERVE_TERMS.join(', ')}
- Keep ticker symbols ($BTC, $ETH, etc.) in English
- Use natural, fluent ${localeName} — not literal word-for-word translation
- For crypto/finance terminology, use the standard ${localeName} terms used by major exchanges`,
            },
            { role: 'user', content: JSON.stringify(batch) },
          ],
        }),
      });

      if (res.status === 400) {
        const text = await res.text();
        if (text.includes('API key expired') || text.includes('invalid')) {
          deadKeys.add(key);
          continue;
        }
      }
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      const data = await res.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;

      return JSON.parse(content);
    } catch {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return {};
}

// ─── Translate a locale ─────────────────────────────────────────────────
async function translateLocale(locale: string): Promise<void> {
  const dstPath = resolve(MESSAGES_DIR, `${locale}.json`);

  // Load existing translations (nested format)
  let existingNested: Record<string, any> = {};
  try {
    existingNested = JSON.parse(readFileSync(dstPath, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  const existingFlat = flatten(existingNested);

  // Find keys that need translation
  const toTranslate = Object.fromEntries(
    Object.entries(flatSource).filter(([k, v]) => v !== '' && !(k in existingFlat)),
  );

  const keyCount = Object.keys(toTranslate).length;
  if (keyCount === 0) {
    console.log(`⏭ ${locale}: up to date`);
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] ${locale}: ${keyCount} keys to translate`);
    return;
  }

  console.log(`⏳ ${locale}: translating ${keyCount} keys...`);

  const translated: Record<string, string> = {};
  const keys = Object.keys(toTranslate);
  const batches = Array.from({ length: Math.ceil(keys.length / BATCH_SIZE) }, (_, i) =>
    keys.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE),
  );

  // Translate all batches in parallel
  await Promise.all(batches.map(async (batchKeys) => {
    const batch = Object.fromEntries(batchKeys.map(k => [k, toTranslate[k]]));
    const result = await translateBatch(batch, locale);
    Object.assign(translated, result);
  }));

  // Merge with existing, copy empty-string values as-is
  const merged = { ...existingFlat, ...translated };
  for (const [k, v] of Object.entries(flatSource)) {
    if (v === '') merged[k] = '';
  }

  // Sort keys and write as nested JSON
  const sortedFlat = Object.fromEntries(
    Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)),
  );
  const nested = unflatten(sortedFlat);

  mkdirSync(MESSAGES_DIR, { recursive: true });
  writeFileSync(dstPath, JSON.stringify(nested, null, 2) + '\n');

  const translatedCount = Object.keys(translated).length;
  const failedCount = keyCount - translatedCount;
  console.log(`✓ ${locale}: ${translatedCount}/${keyCount} keys translated${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
}

// ─── Main ──────────────────────────────────────────────────────────────
const startTime = Date.now();

// Run all locales in parallel
await Promise.all(targetLocales.map(locale => translateLocale(locale)));

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s. Dead keys: ${deadKeys.size}/${apiKeys.length}`);
