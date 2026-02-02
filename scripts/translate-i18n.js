#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

const LANGUAGES = {
  'ar': 'Arabic',
  'de': 'German',
  'es': 'Spanish',
  'fr': 'French',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese (Brazilian)',
  'ru': 'Russian',
  'th': 'Thai',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithGroq(text, targetLanguage, retries = 3) {
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
        const waitTime = Math.ceil(parseFloat(errorData.error?.message?.match(/(\d+\.?\d*)(s|ms)/)?.[1] || 5) * (errorData.error?.message?.includes('ms') ? 1 : 1000)) + 1000;
        console.log(`    Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`    Attempt ${attempt} failed, retrying...`);
      await sleep(3000);
    }
  }
}

function chunkObject(obj, maxSize = 50) {
  const chunks = [];
  const entries = Object.entries(obj);
  
  for (let i = 0; i < entries.length; i += maxSize) {
    chunks.push(Object.fromEntries(entries.slice(i, i + maxSize)));
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

async function translateLanguage(langCode, langName, sourceContent) {
  console.log(`\n📝 Translating to ${langName} (${langCode})...`);
  
  const flattened = flattenObject(sourceContent);
  const chunks = chunkObject(flattened, 40);
  const translatedFlat = {};
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
    
    try {
      const chunkJson = JSON.stringify(chunks[i], null, 2);
      const translated = await translateWithGroq(chunkJson, langName);
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = translated.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsedChunk = JSON.parse(cleanedResponse);
      Object.assign(translatedFlat, parsedChunk);
      
      // Rate limiting - wait 6 seconds between chunks for free tier
      await new Promise(resolve => setTimeout(resolve, 6000));
    } catch (error) {
      console.error(`  ⚠️ Error in chunk ${i + 1}: ${error.message}`);
      // Use English as fallback for this chunk
      Object.assign(translatedFlat, chunks[i]);
    }
  }
  
  return unflattenObject(translatedFlat);
}

async function main() {
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('🌍 Starting i18n translation process...');
  console.log(`📁 Messages directory: ${MESSAGES_DIR}`);
  
  // Read English source
  const enPath = path.join(MESSAGES_DIR, 'en.json');
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  console.log(`✅ Loaded English source (${Object.keys(flattenObject(enContent)).length} strings)`);
  
  // Translate each language
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    try {
      const translated = await translateLanguage(langCode, langName, enContent);
      
      const outputPath = path.join(MESSAGES_DIR, `${langCode}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2) + '\n');
      console.log(`✅ Saved ${langCode}.json`);
    } catch (error) {
      console.error(`❌ Failed to translate ${langCode}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Translation complete!');
}

main().catch(console.error);
