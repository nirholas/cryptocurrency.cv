/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Bot } from 'grammy';
import { BOT_TOKEN, VERSION } from './config.js';

// Commands
import { newsCommand } from './commands/news.js';
import { breakingCommand } from './commands/breaking.js';
import { priceCommand } from './commands/price.js';
import { sentimentCommand } from './commands/sentiment.js';
import { fearGreedCommand } from './commands/feargreed.js';
import { trendingCommand } from './commands/trending.js';
import { digestCommand } from './commands/digest.js';
import { whalesCommand } from './commands/whales.js';
import { askCommand } from './commands/ask.js';
import { searchCommand } from './commands/search.js';

// Inline mode
import { handleInlineQuery } from './inline.js';

// Channel broadcast
import { startBroadcast, stopBroadcast } from './broadcast.js';

// ---------------------------------------------------------------------------
// Validate token
// ---------------------------------------------------------------------------

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required.');
  console.error('   Get one from @BotFather on Telegram.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Create bot
// ---------------------------------------------------------------------------

const bot = new Bot(BOT_TOKEN);

// ---------------------------------------------------------------------------
// /start & /help
// ---------------------------------------------------------------------------

const HELP_TEMPLATE = `
📰 <b>Free Crypto News Bot</b> v${VERSION}

Real-time crypto news, prices, sentiment & market data from 200+ sources.

<b>Commands:</b>

📰 /news [category] — Latest headlines
  Categories: bitcoin, ethereum, defi, nft, solana, regulation, trading…

🚨 /breaking — Breaking crypto news

💰 /price [coin] — Check prices
  /price btc eth sol — Multiple coins
  /price — Default: BTC, ETH, SOL

🧠 /sentiment [asset] — AI sentiment analysis
  /sentiment BTC — BTC-specific sentiment
  /sentiment — Overall market

😱 /fear — Fear & Greed Index

🔥 /trending — Trending topics (24h)

📋 /digest — Daily AI-powered news digest

🐋 /whales — Whale transaction alerts

🤖 /ask <question> — Ask AI about crypto
  /ask What's happening with Bitcoin?

🔍 /search <query> — Search news articles
  /search ethereum upgrade

<b>Inline Mode:</b>
Type <code>@FCN_BOT bitcoin</code> in any chat to share headlines!

<i>Powered by cryptocurrency.cv · 200+ sources · No API key needed</i>
`;

function getHelpText(): string {
  const username = bot.isInited() ? bot.botInfo.username : 'FCN_BOT';
  return HELP_TEMPLATE.replace('@FCN_BOT', `@${username}`).trim();
}

bot.command('start', async (ctx) => {
  await ctx.reply(getHelpText(), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply(getHelpText(), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });
});

// ---------------------------------------------------------------------------
// Register commands
// ---------------------------------------------------------------------------

bot.command('news', newsCommand);
bot.command('latest', newsCommand); // alias
bot.command('breaking', breakingCommand);
bot.command('price', priceCommand);
bot.command('prices', priceCommand); // alias
bot.command('sentiment', sentimentCommand);
bot.command('fear', fearGreedCommand);
bot.command('feargreed', fearGreedCommand); // alias
bot.command('trending', trendingCommand);
bot.command('digest', digestCommand);
bot.command('whales', whalesCommand);
bot.command('whale', whalesCommand); // alias
bot.command('ask', askCommand);
bot.command('search', searchCommand);

// ---------------------------------------------------------------------------
// Inline mode
// ---------------------------------------------------------------------------

bot.on('inline_query', handleInlineQuery);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

bot.catch((err) => {
  console.error('Bot error:', err.message ?? err);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Initialize bot (fetches bot info from Telegram)
  await bot.init();

  // Set bot command menu
  await bot.api.setMyCommands([
    { command: 'news', description: 'Latest crypto news headlines' },
    { command: 'breaking', description: 'Breaking crypto news' },
    { command: 'price', description: 'Check crypto prices (e.g. /price btc eth)' },
    { command: 'sentiment', description: 'AI market sentiment analysis' },
    { command: 'fear', description: 'Fear & Greed Index' },
    { command: 'trending', description: 'Trending topics (24h)' },
    { command: 'digest', description: 'Daily AI news digest' },
    { command: 'whales', description: 'Whale transaction alerts' },
    { command: 'ask', description: 'Ask AI about crypto news' },
    { command: 'search', description: 'Search news articles' },
    { command: 'help', description: 'Show all commands' },
  ]);

  // Start channel broadcast (if TELEGRAM_CHANNEL_ID is set)
  startBroadcast(bot);

  // Start polling
  console.log(`🤖 Free Crypto News Telegram Bot v${VERSION}`);
  console.log(`   Bot: @${bot.botInfo.username}`);
  console.log('   Listening for messages...');
  console.log('');

  bot.start({
    onStart: (info) => {
      console.log(`✅ Bot started as @${info.username}`);
    },
  });
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`\n🛑 ${signal} received — shutting down...`);
    stopBroadcast();
    bot.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
