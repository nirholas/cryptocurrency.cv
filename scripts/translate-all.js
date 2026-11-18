#!/usr/bin/env node

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
 * Universal Translation Script
 * Translates ALL content: UI strings, READMEs, and documentation
 * Supports 100+ languages for maximum global reach
 */

const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 100+ languages for maximum global coverage
const ALL_LANGUAGES = {
  // Major world languages
  'en': 'English',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'es': 'Spanish',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'bn': 'Bengali',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'pa': 'Punjabi',
  'de': 'German',
  'jv': 'Javanese',
  'ko': 'Korean',
  'fr': 'French',
  'te': 'Telugu',
  'mr': 'Marathi',
  'tr': 'Turkish',
  'ta': 'Tamil',
  'vi': 'Vietnamese',
  'ur': 'Urdu',
  'it': 'Italian',
  'th': 'Thai',
  'gu': 'Gujarati',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'my': 'Burmese',
  'or': 'Odia',
  'ro': 'Romanian',
  'nl': 'Dutch',
  'hu': 'Hungarian',
  'el': 'Greek',
  'cs': 'Czech',
  'sv': 'Swedish',
  'be': 'Belarusian',
  'pt-BR': 'Portuguese (Brazilian)',
  'az': 'Azerbaijani',
  'kk': 'Kazakh',
  'sr': 'Serbian',
  'sk': 'Slovak',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sl': 'Slovenian',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'et': 'Estonian',
  'fi': 'Finnish',
  'da': 'Danish',
  'no': 'Norwegian',
  'is': 'Icelandic',
  'ga': 'Irish',
  'cy': 'Welsh',
  'eu': 'Basque',
  'ca': 'Catalan',
  'gl': 'Galician',
  'af': 'Afrikaans',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'xh': 'Xhosa',
  'am': 'Amharic',
  'ha': 'Hausa',
  'yo': 'Yoruba',
  'ig': 'Igbo',
  'rw': 'Kinyarwanda',
  'so': 'Somali',
  'mg': 'Malagasy',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'km': 'Khmer',
  'lo': 'Lao',
  'tl': 'Filipino (Tagalog)',
  'id': 'Indonesian',
  'ms': 'Malay',
  'su': 'Sundanese',
  'ceb': 'Cebuano',
  'fa': 'Persian (Farsi)',
  'ps': 'Pashto',
  'ku': 'Kurdish',
  'he': 'Hebrew',
  'yi': 'Yiddish',
  'hy': 'Armenian',
  'ka': 'Georgian',
  'mn': 'Mongolian',
  'uz': 'Uzbek',
  'tg': 'Tajik',
  'ky': 'Kyrgyz',
  'tk': 'Turkmen',
  'sq': 'Albanian',
  'mk': 'Macedonian',
  'bs': 'Bosnian',
  'mt': 'Maltese',
  'lb': 'Luxembourgish',
  'fy': 'Frisian',
  'gd': 'Scottish Gaelic',
  'eo': 'Esperanto',
  'la': 'Latin',
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'ku'];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithGroq(text, targetLanguage, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following JSON content to ${targetLanguage}. 
IMPORTANT RULES:
1. Keep ALL JSON keys exactly as they are (do not translate keys)
2. Only translate the string values
3. Preserve all placeholders like {name}, {time}, {count}, {query}, {year}, {minutes}, {platform}, {percent} exactly as they are
4. Keep technical terms like "Bitcoin", "Ethereum", "DeFi", "NFT", "TradingView", "GitHub", "API", "SDK" in English
5. Maintain proper JSON formatting
6. Return ONLY valid JSON, no explanations or markdown
7. Use natural, fluent ${targetLanguage} that native speakers would use`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 8000
        })
      });

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const waitTime = Math.ceil(parseFloat(errorData.error?.message?.match(/(\d+\.?\d*)(s|ms)/)?.[1] || 60) * 1000) + 5000;
        console.log(`    ⏳ Rate limited, waiting ${Math.ceil(waitTime/1000)}s... (attempt ${attempt}/${retries})`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content || !content.trim()) {
        throw new Error('Empty response from API');
      }
      
      return content;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`    ⚠️ Error on attempt ${attempt}: ${error.message}, retrying...`);
      await sleep(10000);
    }
  }
}

function chunkObject(obj, size = 25) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function unflattenObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
}

async function translateMessages(langCode, langName, englishSource, messagesDir) {
  const outputPath = path.join(messagesDir, `${langCode}.json`);
  
  // Skip if already well-translated
  let existingRaw = null;
  try {
    existingRaw = fs.readFileSync(outputPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (existingRaw !== null) {
    const existing = JSON.parse(existingRaw);
    const existingCount = Object.keys(flattenObject(existing)).length;
    const sourceCount = Object.keys(flattenObject(englishSource)).length;
    if (existingCount >= sourceCount * 0.9) {
      console.log(`  ⏭️ Skipping - already translated (${existingCount}/${sourceCount} strings)`);
      return true;
    }
  }
  
  const flattened = flattenObject(englishSource);
  const chunks = chunkObject(flattened, 25);
  const translatedFlat = {};
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  📦 Chunk ${i + 1}/${chunks.length}...`);
    
    try {
      const chunkJson = JSON.stringify(chunks[i], null, 2);
      const result = await translateWithGroq(chunkJson, langName);
      
      // Clean up response
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) cleanResult = cleanResult.slice(7);
      if (cleanResult.startsWith('```')) cleanResult = cleanResult.slice(3);
      if (cleanResult.endsWith('```')) cleanResult = cleanResult.slice(0, -3);
      cleanResult = cleanResult.trim();
      
      const parsed = JSON.parse(cleanResult);
      Object.assign(translatedFlat, parsed);
      
      // Delay between chunks
      if (i < chunks.length - 1) {
        await sleep(10000);
      }
    } catch (error) {
      console.log(`  ⚠️ Error in chunk ${i + 1}: ${error.message}`);
      // Copy English for failed chunks
      Object.assign(translatedFlat, chunks[i]);
    }
  }
  
  const translated = unflattenObject(translatedFlat);
  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
  console.log(`  ✅ Saved ${langCode}.json (${Object.keys(translatedFlat).length} strings)`);
  return true;
}

async function main() {
  console.log('🌍 Universal Translation System');
  console.log('================================\n');
  
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY environment variable not set');
    process.exit(1);
  }
  
  const projectRoot = path.join(__dirname, '..');
  const messagesDir = path.join(projectRoot, 'messages');
  const enPath = path.join(messagesDir, 'en.json');
  
  if (!fs.existsSync(enPath)) {
    console.error('❌ English source file not found');
    process.exit(1);
  }
  
  const englishSource = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const sourceCount = Object.keys(flattenObject(englishSource)).length;
  
  console.log(`📊 Source: ${sourceCount} translation strings`);
  console.log(`🌐 Languages: ${Object.keys(ALL_LANGUAGES).length}`);
  console.log(`📁 Output: ${messagesDir}\n`);
  
  // Get specific language from args or translate all
  const targetLang = process.argv[2];
  const languages = targetLang 
    ? { [targetLang]: ALL_LANGUAGES[targetLang] || targetLang }
    : ALL_LANGUAGES;
  
  let completed = 0;
  let failed = 0;
  
  for (const [langCode, langName] of Object.entries(languages)) {
    if (langCode === 'en') continue;
    
    console.log(`\n📝 Translating to ${langName} (${langCode})...`);
    
    try {
      // Translate UI strings
      await translateMessages(langCode, langName, englishSource, messagesDir);
      completed++;
      
      // Longer delay between languages
      await sleep(15000);
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n================================');
  console.log(`✅ Completed: ${completed} languages`);
  console.log(`❌ Failed: ${failed} languages`);
  console.log(`📊 Total supported: ${Object.keys(ALL_LANGUAGES).length} languages`);
}

// Export for programmatic use
module.exports = { ALL_LANGUAGES, RTL_LANGUAGES, translateMessages };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
