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


const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// Only new languages to add
const NEW_LANGUAGES = {
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'cs': 'Czech',
  'da': 'Danish',
  'el': 'Greek',
  'fa': 'Persian (Farsi)',
  'fi': 'Finnish',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'ms': 'Malay',
  'no': 'Norwegian',
  'ro': 'Romanian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'sw': 'Swahili',
  'ta': 'Tamil',
  'te': 'Telugu',
  'tl': 'Filipino (Tagalog)',
  'uk': 'Ukrainian',
  'ur': 'Urdu'
};

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
4. Keep technical terms like "Bitcoin", "Ethereum", "DeFi", "NFT", "TradingView", "GitHub" in English
5. Maintain proper JSON formatting
6. Return ONLY valid JSON, no explanations or markdown`
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
        const errorData = await response.json();
        const waitTime = Math.ceil(parseFloat(errorData.error?.message?.match(/(\d+\.?\d*)(s|ms)/)?.[1] || 30) * (errorData.error?.message?.includes('ms') ? 1 : 1000)) + 2000;
        console.log(`    Rate limited, waiting ${Math.ceil(waitTime/1000)}s... (attempt ${attempt}/${retries})`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      if (!content || !content.trim()) {
        throw new Error('Empty response from API');
      }
      
      return content;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`    Error on attempt ${attempt}: ${error.message}, retrying...`);
      await sleep(5000);
    }
  }
}

function chunkObject(obj, size = 30) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

async function translateLanguage(langCode, langName, englishSource) {
  console.log(`\n📝 Translating to ${langName} (${langCode})...`);
  
  const outputPath = path.join(MESSAGES_DIR, `${langCode}.json`);
  
  // Skip if already exists
  let existingRaw = null;
  try {
    existingRaw = fs.readFileSync(outputPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (existingRaw !== null) {
    const existing = JSON.parse(existingRaw);
    if (Object.keys(existing).length > 300) {
      console.log(`  ⏭️ Skipping - already translated`);
      return;
    }
  }
  
  const chunks = chunkObject(englishSource, 30);
  const translated = {};
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
    
    try {
      const chunkJson = JSON.stringify(chunks[i], null, 2);
      const result = await translateWithGroq(chunkJson, langName);
      
      // Clean up the response
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.slice(7);
      }
      if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.slice(3);
      }
      if (cleanResult.endsWith('```')) {
        cleanResult = cleanResult.slice(0, -3);
      }
      cleanResult = cleanResult.trim();
      
      const parsed = JSON.parse(cleanResult);
      // Only accept keys we asked for, with the same value type as the English source
      for (const [key, value] of Object.entries(parsed)) {
        if (Object.prototype.hasOwnProperty.call(chunks[i], key) && typeof value === typeof chunks[i][key]) {
          translated[key] = value;
        }
      }
      
      // Longer delay between chunks to avoid rate limits
      if (i < chunks.length - 1) {
        await sleep(8000);
      }
    } catch (error) {
      console.log(`  ⚠️ Error in chunk ${i + 1}: ${error.message}`);
      // Copy English values for failed chunks
      Object.assign(translated, chunks[i]);
    }
  }
  
  // Save the translation
  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
  console.log(`✅ Saved ${langCode}.json (${Object.keys(translated).length} strings)`);
  
  // Wait between languages
  await sleep(10000);
}

async function main() {
  console.log('🌍 Adding new languages to i18n...');
  console.log(`📁 Messages directory: ${MESSAGES_DIR}`);
  
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY environment variable not set');
    process.exit(1);
  }
  
  // Load English source
  const englishPath = path.join(MESSAGES_DIR, 'en.json');
  const englishSource = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
  console.log(`✅ Loaded English source (${Object.keys(englishSource).length} strings)`);
  console.log(`🆕 Adding ${Object.keys(NEW_LANGUAGES).length} new languages\n`);
  
  for (const [langCode, langName] of Object.entries(NEW_LANGUAGES)) {
    try {
      await translateLanguage(langCode, langName, englishSource);
    } catch (error) {
      console.error(`❌ Failed to translate ${langName}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Translation complete!');
  console.log(`📊 Total languages: ${17 + Object.keys(NEW_LANGUAGES).length} (including English)`);
}

main().catch(console.error);
