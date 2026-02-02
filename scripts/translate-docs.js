#!/usr/bin/env node
/**
 * Docs Translation Script using GROQ API
 * 
 * Translates Markdown documentation to specified languages.
 * 
 * Usage:
 *   GROQ_API_KEY=xxx node scripts/translate-docs.js --file docs/API.md --locales zh-CN,es,de,ja,ko
 */

const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  tokensPerMinute: 30000,
  minDelayBetweenRequests: 2000, // 2 seconds minimum between requests
  backoffMultiplier: 2,
  maxBackoff: 60000, // 1 minute max backoff
  currentDelay: 2000
};

const LANGUAGES = {
  'zh-CN': 'Chinese (Simplified)',
  'es': 'Spanish',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'fr': 'French',
  'pt': 'Portuguese (Brazilian)',
  'ru': 'Russian',
  'it': 'Italian',
  'ar': 'Arabic',
  'nl': 'Dutch',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'id': 'Indonesian',
  'zh-TW': 'Chinese (Traditional)'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff with jitter
function getBackoffDelay(attempt, baseDelay = 2000) {
  const exponentialDelay = baseDelay * Math.pow(RATE_LIMIT.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(exponentialDelay + jitter, RATE_LIMIT.maxBackoff);
}

// Parse wait time from GROQ error message
function parseWaitTime(errorMessage) {
  // Match patterns like "try again in 1.5s" or "try again in 500ms"
  const match = errorMessage?.match(/try again in (\d+\.?\d*)(s|ms)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return Math.ceil(value * (unit === 'ms' ? 1 : 1000)) + 500; // Add 500ms buffer
  }
  return null;
}

async function translateWithGroq(content, targetLanguage, retries = 5) {
  // Pre-request delay for rate limiting
  await sleep(RATE_LIMIT.currentDelay);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`      📡 API request (attempt ${attempt}/${retries})...`);
      
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
              content: `You are an expert technical translator specializing in cryptocurrency, blockchain, and software documentation.
Translate the following Markdown content to ${targetLanguage}.

IMPORTANT RULES:
1. Preserve ALL Markdown formatting (headers, code blocks, links, tables, lists, bold, italic)
2. Keep code snippets, URLs, API endpoints, and technical identifiers UNCHANGED
3. Keep emoji unchanged
4. Maintain the same document structure
5. Use natural, fluent language appropriate for the target audience
6. Do NOT translate:
   - URLs and links
   - Code variable names and function names
   - JSON keys and values in code blocks
   - File paths
   - Brand names (Bitcoin, Ethereum, CoinDesk, The Block, etc.)
   - Technical terms (API, JSON, SDK, HTTP, REST, WebSocket, SSE, RSS)
   - Parameter names in tables (like 'limit', 'source', 'page', etc.)
7. Translate table headers and descriptions
8. Keep curl commands and code examples exactly as they are
9. Return ONLY the translated Markdown, no explanations`
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: 0.3,
          max_tokens: 32000
        })
      });

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || '';
        
        // Try to parse the wait time from error message
        let waitTime = parseWaitTime(errorMessage);
        
        if (!waitTime) {
          // Use exponential backoff if no wait time specified
          waitTime = getBackoffDelay(attempt);
        }
        
        console.log(`      ⏳ Rate limited. Waiting ${Math.round(waitTime / 1000)}s before retry...`);
        
        // Increase future delays to avoid hitting rate limits
        RATE_LIMIT.currentDelay = Math.min(
          RATE_LIMIT.currentDelay * 1.5,
          RATE_LIMIT.maxBackoff
        );
        
        await sleep(waitTime);
        continue;
      }

      if (response.status === 503 || response.status === 502) {
        const waitTime = getBackoffDelay(attempt, 5000);
        console.log(`      🔄 Service temporarily unavailable. Waiting ${Math.round(waitTime / 1000)}s...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Success - gradually reduce delay (but not below minimum)
      RATE_LIMIT.currentDelay = Math.max(
        RATE_LIMIT.currentDelay * 0.9,
        RATE_LIMIT.minDelayBetweenRequests
      );
      
      console.log(`      ✅ Translation received`);
      return data.choices[0].message.content;
    } catch (error) {
      const waitTime = getBackoffDelay(attempt, 3000);
      if (attempt === retries) {
        throw error;
      }
      console.log(`      ⚠️ Attempt ${attempt} failed: ${error.message}`);
      console.log(`      🔄 Retrying in ${Math.round(waitTime / 1000)}s...`);
      await sleep(waitTime);
    }
  }
}

async function translateFile(filePath, targetLocale) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const dir = path.dirname(fullPath);
  const ext = path.extname(fullPath);
  const baseName = path.basename(fullPath, ext);
  
  // Output path: API.md -> API.zh-CN.md
  const outputPath = path.join(dir, `${baseName}.${targetLocale}${ext}`);
  
  const languageName = LANGUAGES[targetLocale] || targetLocale;
  console.log(`\n🌐 Translating ${path.basename(filePath)} → ${languageName} (${targetLocale})...`);

  try {
    // For large files, split into chunks
    const lines = content.split('\n');
    const chunkSize = 500; // lines per chunk
    
    if (lines.length > chunkSize) {
      console.log(`   📄 Large file detected (${lines.length} lines), processing in chunks...`);
      
      let translatedContent = '';
      const totalChunks = Math.ceil(lines.length / chunkSize);
      
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunkNum = Math.floor(i / chunkSize) + 1;
        const chunk = lines.slice(i, i + chunkSize).join('\n');
        console.log(`   📦 Chunk ${chunkNum}/${totalChunks} (${chunk.length} chars)...`);
        
        const translatedChunk = await translateWithGroq(chunk, languageName);
        translatedContent += translatedChunk + '\n';
        
        // Progressive delay between chunks
        if (i + chunkSize < lines.length) {
          const chunkDelay = Math.max(RATE_LIMIT.currentDelay, 3000);
          console.log(`   ⏳ Waiting ${Math.round(chunkDelay / 1000)}s before next chunk...`);
          await sleep(chunkDelay);
        }
      }
      
      // Add language header
      const header = `<!-- This file is auto-generated. Do not edit directly. -->\n<!-- Language: ${languageName} (${targetLocale}) -->\n\n`;
      fs.writeFileSync(outputPath, header + translatedContent.trim());
    } else {
      const translated = await translateWithGroq(content, languageName);
      
      // Add language header
      const header = `<!-- This file is auto-generated. Do not edit directly. -->\n<!-- Language: ${languageName} (${targetLocale}) -->\n\n`;
      fs.writeFileSync(outputPath, header + translated);
    }
    
    console.log(`   ✅ Saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY environment variable is required');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  
  // Parse arguments
  const fileIndex = args.indexOf('--file');
  const localesIndex = args.indexOf('--locales');
  
  if (fileIndex === -1) {
    console.log('Usage: GROQ_API_KEY=xxx node scripts/translate-docs.js --file docs/API.md --locales zh-CN,es,de,ja,ko');
    process.exit(1);
  }
  
  const file = args[fileIndex + 1];
  const locales = localesIndex !== -1 
    ? args[localesIndex + 1].split(',') 
    : ['zh-CN', 'es', 'de', 'ja', 'ko']; // Default to 5 languages
  
  console.log('🌍 Starting documentation translation...');
  console.log(`📄 File: ${file}`);
  console.log(`🌐 Languages: ${locales.map(l => LANGUAGES[l] || l).join(', ')}\n`);

  const results = { success: 0, failed: 0 };

  for (const locale of locales) {
    const success = await translateFile(file, locale);
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // Rate limiting between languages
    if (locales.indexOf(locale) < locales.length - 1) {
      const langDelay = Math.max(RATE_LIMIT.currentDelay, 5000);
      console.log(`   ⏳ Waiting ${Math.round(langDelay / 1000)}s before next language...`);
      await sleep(langDelay);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Translation Summary:');
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log('═'.repeat(50));

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Translation failed:', error);
  process.exit(1);
});
