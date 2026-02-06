/**
 * AI API Examples - JavaScript/Node.js
 * Free Crypto News API - https://github.com/nirholas/free-crypto-news
 * 
 * Examples for all AI-powered endpoints.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// POST /api/ai - Main AI Endpoint
// =============================================================================

async function aiRequest(action, options = {}) {
  const response = await fetch(`${BASE_URL}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...options })
  });
  return response.json();
}

// =============================================================================
// GET /api/sentiment - Sentiment Analysis
// =============================================================================

async function getSentiment({ asset, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit });
  if (asset) params.append('asset', asset);
  
  const response = await fetch(`${BASE_URL}/api/sentiment?${params}`);
  return response.json();
}

async function analyzeTextSentiment(title, content) {
  return aiRequest('sentiment', { title, content });
}

// =============================================================================
// GET /api/summarize - Article Summarization
// =============================================================================

async function summarizeArticle(url) {
  const response = await fetch(`${BASE_URL}/api/summarize?url=${encodeURIComponent(url)}`);
  return response.json();
}

async function summarizeText(text, maxLength = 200) {
  return aiRequest('summarize', { text, max_length: maxLength });
}

// =============================================================================
// GET /api/ask - Ask AI Questions
// =============================================================================

async function askAI(question, context) {
  const params = new URLSearchParams({ q: question });
  if (context) params.append('context', context);
  
  const response = await fetch(`${BASE_URL}/api/ask?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/ai/brief - Market Brief
// =============================================================================

async function getMarketBrief() {
  const response = await fetch(`${BASE_URL}/api/ai/brief`);
  return response.json();
}

// =============================================================================
// POST /api/ai/debate - AI Debate
// =============================================================================

async function aiDebate(topic) {
  const response = await fetch(`${BASE_URL}/api/ai/debate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic })
  });
  return response.json();
}

// =============================================================================
// POST /api/ai/counter - Counter Arguments
// =============================================================================

async function getCounterArguments(claim) {
  const response = await fetch(`${BASE_URL}/api/ai/counter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim })
  });
  return response.json();
}

// =============================================================================
// GET /api/ai/agent - AI Agent
// =============================================================================

async function aiAgent(task) {
  const response = await fetch(`${BASE_URL}/api/ai/agent?task=${encodeURIComponent(task)}`);
  return response.json();
}

async function aiAgentPost(task, data) {
  const response = await fetch(`${BASE_URL}/api/ai/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, data })
  });
  return response.json();
}

// =============================================================================
// GET /api/ai/oracle - Price Oracle/Prediction
// =============================================================================

async function getOraclePrediction(asset = 'BTC') {
  const response = await fetch(`${BASE_URL}/api/ai/oracle?asset=${asset}`);
  return response.json();
}

// =============================================================================
// GET /api/entities - Entity Extraction
// =============================================================================

async function extractEntities({ text, url } = {}) {
  const params = new URLSearchParams();
  if (text) params.append('text', text);
  if (url) params.append('url', url);
  
  const response = await fetch(`${BASE_URL}/api/entities?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/ai/relationships - Entity Relationships
// =============================================================================

async function getRelationships(entity) {
  const params = entity ? `?entity=${encodeURIComponent(entity)}` : '';
  const response = await fetch(`${BASE_URL}/api/ai/relationships${params}`);
  return response.json();
}

// =============================================================================
// GET /api/narratives - Narrative Detection
// =============================================================================

async function getNarratives(limit = 10) {
  const response = await fetch(`${BASE_URL}/api/narratives?limit=${limit}`);
  return response.json();
}

// =============================================================================
// GET /api/claims - Claim Detection
// =============================================================================

async function getClaims(limit = 20) {
  const response = await fetch(`${BASE_URL}/api/claims?limit=${limit}`);
  return response.json();
}

// =============================================================================
// GET /api/clickbait - Clickbait Detection
// =============================================================================

async function detectClickbait({ title, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit });
  if (title) params.append('title', title);
  
  const response = await fetch(`${BASE_URL}/api/clickbait?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/factcheck - Fact Checking
// =============================================================================

async function factcheck(claim) {
  const response = await fetch(`${BASE_URL}/api/factcheck?claim=${encodeURIComponent(claim)}`);
  return response.json();
}

// =============================================================================
// POST /api/detect/ai-content - AI Content Detection
// =============================================================================

async function detectAIContent(text) {
  const response = await fetch(`${BASE_URL}/api/detect/ai-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}

// =============================================================================
// GET /api/classify - Article Classification
// =============================================================================

async function classifyArticle({ text, url } = {}) {
  const params = new URLSearchParams();
  if (text) params.append('text', text);
  if (url) params.append('url', url);
  
  const response = await fetch(`${BASE_URL}/api/classify?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/origins - Source Origin Tracking
// =============================================================================

async function getOrigins({ story, limit = 10 } = {}) {
  const params = new URLSearchParams({ limit });
  if (story) params.append('story', story);
  
  const response = await fetch(`${BASE_URL}/api/origins?${params}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  aiRequest,
  getSentiment,
  analyzeTextSentiment,
  summarizeArticle,
  summarizeText,
  askAI,
  getMarketBrief,
  aiDebate,
  getCounterArguments,
  aiAgent,
  aiAgentPost,
  getOraclePrediction,
  extractEntities,
  getRelationships,
  getNarratives,
  getClaims,
  detectClickbait,
  factcheck,
  detectAIContent,
  classifyArticle,
  getOrigins,
  BASE_URL
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('FREE CRYPTO NEWS API - AI EXAMPLES (JavaScript)');
  console.log('='.repeat(60));

  // 1. Sentiment
  console.log('\n📊 1. Sentiment Analysis');
  const sentiment = await getSentiment({ asset: 'BTC', limit: 10 });
  console.log('   Result:', JSON.stringify(sentiment).substring(0, 150) + '...');

  // 2. Summarize
  console.log('\n📝 2. Text Summarization');
  const summary = await summarizeText(
    'Bitcoin reached a new all-time high today as institutional investors continue to pour money into crypto markets.'
  );
  console.log('   Summary:', summary);

  // 3. Ask AI
  console.log('\n❓ 3. Ask AI');
  const answer = await askAI('What is the current Bitcoin sentiment?');
  console.log('   Answer:', answer);

  // 4. Market Brief
  console.log('\n📋 4. Market Brief');
  const brief = await getMarketBrief();
  console.log('   Brief:', brief);

  // 5. Debate
  console.log('\n🗣️ 5. AI Debate');
  const debate = await aiDebate('Bitcoin will replace gold as a store of value');
  console.log('   Debate:', JSON.stringify(debate).substring(0, 200) + '...');

  // 6. Narratives
  console.log('\n📈 6. Emerging Narratives');
  const narratives = await getNarratives(5);
  console.log('   Narratives:', narratives);

  // 7. Entity Extraction
  console.log('\n🏷️ 7. Entity Extraction');
  const entities = await extractEntities({
    text: 'Vitalik Buterin announced a major Ethereum upgrade while Coinbase listed new tokens'
  });
  console.log('   Entities:', entities);

  // 8. Clickbait Detection
  console.log('\n🎣 8. Clickbait Detection');
  const clickbait = await detectClickbait({
    title: "You WON'T BELIEVE what Bitcoin just did!!!"
  });
  console.log('   Clickbait:', clickbait);

  // 9. AI Content Detection
  console.log('\n🤖 9. AI Content Detection');
  const aiDetect = await detectAIContent(
    'This is a sample text to check if it was written by AI.'
  );
  console.log('   AI Detection:', aiDetect);

  console.log('\n' + '='.repeat(60));
  console.log('All AI examples completed!');
  console.log('='.repeat(60));
}

if (require.main === module) {
  runExamples().catch(console.error);
}
