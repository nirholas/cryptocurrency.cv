/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Free Crypto News Slack Bot
 * 
 * Posts crypto news to a Slack channel.
 * 100% FREE - no API keys required for the news API!
 * 
 * Setup:
 * 1. Create a Slack App at https://api.slack.com/apps
 * 2. Enable "Incoming Webhooks" and create a webhook URL
 * 3. Set SLACK_WEBHOOK_URL environment variable
 * 4. Run: node slack-bot.js
 * 
 * For scheduled posts, use cron or a cloud scheduler.
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const NEWS_API = 'https://cryptocurrency.cv';

if (!SLACK_WEBHOOK_URL) {
  console.error('❌ Missing SLACK_WEBHOOK_URL environment variable');
  console.log('Set it with: export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."');
  process.exit(1);
}

async function fetchNews(endpoint = '/api/news', limit = 5) {
  const url = `${NEWS_API}${endpoint}?limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function fetchTrending() {
  const response = await fetch(`${NEWS_API}/api/trending?limit=5&hours=24`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

function formatNewsMessage(articles, title = '📰 Latest Crypto News') {
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true }
    },
    { type: 'divider' }
  ];

  for (const article of articles) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${article.link}|${article.title}>*\n_${article.source}_ • ${article.timeAgo}`
      }
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🆓 Powered by <https://github.com/nirholas/free-crypto-news|Free Crypto News API>'
        }
      ]
    }
  );

  return { blocks };
}

function formatTrendingMessage(trending) {
  const sentimentEmoji = { bullish: '🟢', bearish: '🔴', neutral: '⚪' };
  
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📊 Trending in Crypto (24h)', emoji: true }
    },
    { type: 'divider' }
  ];

  const topicsText = trending.trending
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${sentimentEmoji[t.sentiment]} *${t.topic}* (${t.count} mentions)`)
    .join('\n');

  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: topicsText }
  });

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `_Based on ${trending.articlesAnalyzed} articles analyzed_` }
      ]
    }
  );

  return { blocks };
}

async function postToSlack(message) {
  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) {
    throw new Error(`Slack error: ${response.status}`);
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════

async function postLatestNews() {
  console.log('📰 Fetching latest news...');
  const data = await fetchNews('/api/news', 5);
  const message = formatNewsMessage(data.articles, '📰 Latest Crypto News');
  await postToSlack(message);
  console.log('✅ Posted latest news to Slack');
}

async function postBreakingNews() {
  console.log('🚨 Fetching breaking news...');
  const data = await fetchNews('/api/breaking', 5);
  if (data.articles.length === 0) {
    console.log('ℹ️ No breaking news right now');
    return;
  }
  const message = formatNewsMessage(data.articles, '🚨 Breaking Crypto News');
  await postToSlack(message);
  console.log('✅ Posted breaking news to Slack');
}

async function postDefiNews() {
  console.log('💰 Fetching DeFi news...');
  const data = await fetchNews('/api/defi', 5);
  const message = formatNewsMessage(data.articles, '💰 DeFi News');
  await postToSlack(message);
  console.log('✅ Posted DeFi news to Slack');
}

async function postBitcoinNews() {
  console.log('₿ Fetching Bitcoin news...');
  const data = await fetchNews('/api/bitcoin', 5);
  const message = formatNewsMessage(data.articles, '₿ Bitcoin News');
  await postToSlack(message);
  console.log('✅ Posted Bitcoin news to Slack');
}

async function postTrending() {
  console.log('📊 Fetching trending topics...');
  const data = await fetchTrending();
  const message = formatTrendingMessage(data);
  await postToSlack(message);
  console.log('✅ Posted trending topics to Slack');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

const command = process.argv[2] || 'latest';

const commands = {
  latest: postLatestNews,
  breaking: postBreakingNews,
  defi: postDefiNews,
  bitcoin: postBitcoinNews,
  trending: postTrending,
};

if (!commands[command]) {
  console.log('Usage: node slack-bot.js [command]');
  console.log('Commands: latest, breaking, defi, bitcoin, trending');
  process.exit(1);
}

commands[command]().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
