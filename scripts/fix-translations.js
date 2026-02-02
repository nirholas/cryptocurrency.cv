#!/usr/bin/env node
/**
 * Fix Broken Translation Files
 * Regenerates translation files that have incomplete or broken content
 */

const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY environment variable is required');
  process.exit(1);
}
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// Languages that need fixing (detected as broken)
const BROKEN_LANGUAGES = {
  'ja': 'Japanese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ko': 'Korean',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'th': 'Thai',
  'vi': 'Vietnamese',
};

// Read source English file
const enSource = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));

// Flatten nested object
function flatten(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flatten(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

// Unflatten object
function unflatten(obj) {
  const result = {};
  for (const key in obj) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = obj[key];
  }
  return result;
}

// Check if a file needs fixing (has empty or placeholder values)
function needsFix(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const flat = flatten(content);
    
    let emptyCount = 0;
    let totalCount = 0;
    
    for (const key in flat) {
      totalCount++;
      const value = flat[key];
      if (
        !value ||
        value === '' ||
        value === '...' ||
        value === '!' ||
        /^[A-Za-z\s]{1,10}$/.test(value) // Short English-only strings (likely untranslated)
      ) {
        emptyCount++;
      }
    }
    
    // If more than 10% of values are empty/broken, needs fix
    return emptyCount / totalCount > 0.1;
  } catch {
    return true; // If can't parse, definitely needs fix
  }
}

async function translateChunk(texts, targetLanguage) {
  const prompt = `Translate these JSON values to ${targetLanguage}. 
This is for a cryptocurrency news website UI.
Return ONLY a JSON array with the translations in the same order.
Preserve any placeholders like {name}, {count}, {time}.
Do not add any explanation.

Values to translate:
${JSON.stringify(texts, null, 2)}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a professional translator specializing in cryptocurrency and fintech. Return only valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    
    throw new Error('No JSON array found in response');
  } catch (error) {
    console.error(`  ❌ Translation failed: ${error.message}`);
    return null;
  }
}

async function translateFile(locale, languageName) {
  console.log(`\n🔧 Fixing ${languageName} (${locale})...`);
  
  const flatEn = flatten(enSource);
  const keys = Object.keys(flatEn);
  const values = Object.values(flatEn);
  
  const translatedFlat = {};
  const CHUNK_SIZE = 30;
  
  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);
    const chunkKeys = keys.slice(i, i + CHUNK_SIZE);
    
    console.log(`  Translating ${i + 1}-${Math.min(i + CHUNK_SIZE, values.length)} of ${values.length}...`);
    
    const translated = await translateChunk(chunk, languageName);
    
    if (translated && translated.length === chunk.length) {
      chunkKeys.forEach((key, idx) => {
        translatedFlat[key] = translated[idx];
      });
    } else {
      // Use English as fallback
      chunkKeys.forEach((key, idx) => {
        translatedFlat[key] = chunk[idx];
      });
      console.log(`  ⚠️ Using English fallback for chunk`);
    }
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Write the result
  const result = unflatten(translatedFlat);
  const outputPath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`  ✅ Saved ${outputPath}`);
}

async function main() {
  console.log('🔍 Checking for broken translation files...\n');
  
  const toFix = [];
  
  // Check all files in messages directory
  const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json') && f !== 'en.json');
  
  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const locale = file.replace('.json', '');
    
    if (needsFix(filePath)) {
      console.log(`❌ ${file} - needs fixing`);
      toFix.push(locale);
    } else {
      console.log(`✅ ${file} - OK`);
    }
  }
  
  if (toFix.length === 0) {
    console.log('\n🎉 All translation files are OK!');
    return;
  }
  
  console.log(`\n📝 Found ${toFix.length} files to fix\n`);
  
  // Language names for translation
  const languageNames = {
    'af': 'Afrikaans', 'am': 'Amharic', 'ar': 'Arabic', 'az': 'Azerbaijani',
    'be': 'Belarusian', 'bg': 'Bulgarian', 'bn': 'Bengali', 'bs': 'Bosnian',
    'ca': 'Catalan', 'ceb': 'Cebuano', 'cs': 'Czech', 'cy': 'Welsh',
    'da': 'Danish', 'de': 'German', 'el': 'Greek', 'eo': 'Esperanto',
    'es': 'Spanish', 'et': 'Estonian', 'eu': 'Basque', 'fa': 'Persian',
    'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian', 'ga': 'Irish',
    'gd': 'Scottish Gaelic', 'gl': 'Galician', 'gu': 'Gujarati', 'ha': 'Hausa',
    'he': 'Hebrew', 'hi': 'Hindi', 'hr': 'Croatian', 'hu': 'Hungarian',
    'hy': 'Armenian', 'id': 'Indonesian', 'ig': 'Igbo', 'is': 'Icelandic',
    'it': 'Italian', 'ja': 'Japanese', 'jv': 'Javanese', 'ka': 'Georgian',
    'kk': 'Kazakh', 'km': 'Khmer', 'kn': 'Kannada', 'ko': 'Korean',
    'ku': 'Kurdish', 'ky': 'Kyrgyz', 'la': 'Latin', 'lb': 'Luxembourgish',
    'lo': 'Lao', 'lt': 'Lithuanian', 'lv': 'Latvian', 'mg': 'Malagasy',
    'mk': 'Macedonian', 'ml': 'Malayalam', 'mn': 'Mongolian', 'mr': 'Marathi',
    'ms': 'Malay', 'mt': 'Maltese', 'my': 'Burmese', 'ne': 'Nepali',
    'nl': 'Dutch', 'no': 'Norwegian', 'or': 'Odia', 'pa': 'Punjabi',
    'pl': 'Polish', 'ps': 'Pashto', 'pt': 'Portuguese', 'pt-BR': 'Brazilian Portuguese',
    'ro': 'Romanian', 'ru': 'Russian', 'rw': 'Kinyarwanda', 'si': 'Sinhala',
    'sk': 'Slovak', 'sl': 'Slovenian', 'so': 'Somali', 'sq': 'Albanian',
    'sr': 'Serbian', 'su': 'Sundanese', 'sv': 'Swedish', 'sw': 'Swahili',
    'ta': 'Tamil', 'te': 'Telugu', 'tg': 'Tajik', 'th': 'Thai',
    'tk': 'Turkmen', 'tl': 'Filipino', 'tr': 'Turkish', 'uk': 'Ukrainian',
    'ur': 'Urdu', 'uz': 'Uzbek', 'vi': 'Vietnamese', 'xh': 'Xhosa',
    'yi': 'Yiddish', 'yo': 'Yoruba', 'zh-CN': 'Chinese Simplified',
    'zh-TW': 'Chinese Traditional', 'zu': 'Zulu',
  };
  
  for (const locale of toFix) {
    const langName = languageNames[locale] || locale;
    await translateFile(locale, langName);
    
    // Longer delay between languages to avoid rate limits
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log('\n🎉 Done fixing translation files!');
}

main().catch(console.error);
