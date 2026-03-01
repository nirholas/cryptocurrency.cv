/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import type { Context } from 'grammy';
import { getMenu, MENU_TEXT } from './menus.js';
import { apiFetch } from './api.js';
import { escHtml, articleLine, fmtUsd, fmtPct, sentimentEmoji, fearGreedEmoji, timeAgo } from './format.js';

// ---------------------------------------------------------------------------
// Callback query router — handles all button presses
// ---------------------------------------------------------------------------

/** Ticker → CoinGecko ID mapping (duplicated from price.ts for callbacks) */
const TICKER_MAP: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin',
  xrp: 'ripple', doge: 'dogecoin', link: 'chainlink', uni: 'uniswap',
  atom: 'cosmos', ton: 'the-open-network', avax: 'avalanche-2', pepe: 'pepe',
  ada: 'cardano', dot: 'polkadot', near: 'near', apt: 'aptos', sui: 'sui',
  arb: 'arbitrum', op: 'optimism', shib: 'shiba-inu',
};

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  await ctx.answerCallbackQuery(); // dismiss the loading spinner

  const [prefix, value] = data.split(':');

  try {
    switch (prefix) {
      // ---- Menu navigation ----
      case 'menu':
        await navigateMenu(ctx, value);
        break;

      // ---- News by category ----
      case 'news':
        await handleNewsCallback(ctx, value);
        break;

      // ---- Price by coin ----
      case 'price':
        await handlePriceCallback(ctx, value);
        break;

      // ---- Sentiment by asset ----
      case 'sentiment':
        await handleSentimentCallback(ctx, value);
        break;

      // ---- Direct command triggers ----
      case 'cmd':
        await handleCommandCallback(ctx, value);
        break;

      default:
        await ctx.answerCallbackQuery({ text: 'Unknown action' });
    }
  } catch (err) {
    console.error('callback error:', err);
    // Try to edit message, fall back to reply
    try {
      await ctx.editMessageText('⚠️ Something went wrong. Try again.', { parse_mode: 'HTML' });
    } catch {
      await ctx.reply('⚠️ Something went wrong. Try again.');
    }
  }
}

// ---------------------------------------------------------------------------
// Menu navigation
// ---------------------------------------------------------------------------

async function navigateMenu(ctx: Context, menuKey: string): Promise<void> {
  const keyboard = getMenu(menuKey);
  const text = MENU_TEXT[menuKey] || '📰 Choose an option:';

  if (keyboard) {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}

// ---------------------------------------------------------------------------
// News callbacks
// ---------------------------------------------------------------------------

async function handleNewsCallback(ctx: Context, category: string): Promise<void> {
  await ctx.editMessageText('⏳ Fetching news…', { parse_mode: 'HTML' });

  const isBreaking = category === 'breaking';
  const endpoint = isBreaking ? '/api/breaking' : '/api/news';
  const params: Record<string, string | number> = { limit: 8 };
  if (category !== 'all' && !isBreaking) params.category = category;

  const data = await apiFetch<{
    articles: Array<{ title: string; link: string; source: string; pubDate?: string; timeAgo?: string }>;
    totalCount: number;
  }>(endpoint, params);

  if (!data.articles?.length) {
    await ctx.editMessageText('No articles found. Try another category.', {
      reply_markup: getMenu('news')!,
    });
    return;
  }

  const label = isBreaking ? '🚨 Breaking' : `📰 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
  const lines = [
    `${label} <b>News</b>`,
    '',
    ...data.articles.map(a => articleLine(a)),
    '',
    `<i>${data.totalCount} articles · cryptocurrency.cv</i>`,
  ];

  const backMenu = new (await import('grammy')).InlineKeyboard()
    .text('📰 More Categories', 'menu:news')
    .text('« Main Menu', 'menu:main');

  await ctx.editMessageText(lines.join('\n'), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: backMenu,
  });
}

// ---------------------------------------------------------------------------
// Price callbacks
// ---------------------------------------------------------------------------

async function handlePriceCallback(ctx: Context, ticker: string): Promise<void> {
  await ctx.editMessageText('⏳ Fetching prices…', { parse_mode: 'HTML' });

  let coinIds: string[];
  let displayTickers: string[];

  if (ticker === 'top10') {
    displayTickers = ['btc', 'eth', 'sol', 'bnb', 'xrp', 'ada', 'doge', 'dot', 'link', 'avax'];
    coinIds = displayTickers.map(t => TICKER_MAP[t] || t);
  } else {
    displayTickers = [ticker];
    coinIds = [TICKER_MAP[ticker] || ticker];
  }

  type PriceResponse = Record<string, { usd: number; usd_24h_change: number }>;
  const data = await apiFetch<PriceResponse>('/api/prices', {
    coins: coinIds.join(','),
  });

  const lines = ['💰 <b>Prices</b>', ''];

  for (let i = 0; i < coinIds.length; i++) {
    const id = coinIds[i];
    const t = displayTickers[i].toUpperCase();
    const info = data[id];
    if (!info) {
      lines.push(`• <b>${escHtml(t)}</b>: not found`);
      continue;
    }
    const name = id.charAt(0).toUpperCase() + id.slice(1);
    lines.push(`• <b>${escHtml(name)}</b> (${t}): ${fmtUsd(info.usd)}  ${fmtPct(info.usd_24h_change)}`);
  }

  lines.push('', '<i>Data via cryptocurrency.cv</i>');

  const backMenu = new (await import('grammy')).InlineKeyboard()
    .text('💰 More Coins', 'menu:prices')
    .text('« Main Menu', 'menu:main');

  await ctx.editMessageText(lines.join('\n'), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: backMenu,
  });
}

// ---------------------------------------------------------------------------
// Sentiment callbacks
// ---------------------------------------------------------------------------

async function handleSentimentCallback(ctx: Context, asset: string): Promise<void> {
  await ctx.editMessageText('⏳ Analyzing sentiment…', { parse_mode: 'HTML' });

  const params: Record<string, string | number> = { limit: 10 };
  if (asset !== 'overall') params.asset = asset;

  const data = await apiFetch<{
    market: { overall: string; score: number; confidence: number; summary: string; keyDrivers: string[] };
    meta: { articlesAnalyzed: number };
  }>('/api/sentiment', params);

  const m = data.market;
  const assetLabel = asset !== 'overall' ? ` · ${asset}` : '';

  const lines = [
    `${sentimentEmoji(m.overall)} <b>Sentiment</b>${assetLabel}`,
    '',
    `<b>Overall:</b> ${escHtml(m.overall.replace(/_/g, ' '))} (${m.score}/100)`,
    `<b>Confidence:</b> ${m.confidence}%`,
    '',
    `💬 ${escHtml(m.summary)}`,
  ];

  if (m.keyDrivers?.length) {
    lines.push('', '<b>Key Drivers:</b>');
    for (const d of m.keyDrivers.slice(0, 3)) {
      lines.push(`  → ${escHtml(d)}`);
    }
  }

  lines.push('', `<i>${data.meta.articlesAnalyzed} articles analyzed · cryptocurrency.cv</i>`);

  const backMenu = new (await import('grammy')).InlineKeyboard()
    .text('🧠 Other Assets', 'menu:sentiment')
    .text('« Main Menu', 'menu:main');

  await ctx.editMessageText(lines.join('\n'), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: backMenu,
  });
}

// ---------------------------------------------------------------------------
// Direct command callbacks (cmd:*)
// ---------------------------------------------------------------------------

async function handleCommandCallback(ctx: Context, command: string): Promise<void> {
  await ctx.editMessageText('⏳ Loading…', { parse_mode: 'HTML' });

  const { InlineKeyboard } = await import('grammy');
  const backButton = new InlineKeyboard().text('« Main Menu', 'menu:main');

  switch (command) {
    case 'fear': {
      const data = await apiFetch<{
        current: { value: number; valueClassification: string };
        trend: { direction: string; change7d: number; change30d: number; averageValue7d: number; averageValue30d: number };
      }>('/api/fear-greed', { days: 7 });

      const c = data.current;
      const t = data.trend;
      const bar = '█'.repeat(Math.round(c.value / 100 * 15)) + '░'.repeat(15 - Math.round(c.value / 100 * 15));

      const lines = [
        `${fearGreedEmoji(c.value)} <b>Fear & Greed Index</b>`,
        '',
        `<b>${c.value}/100</b> — ${escHtml(c.valueClassification)}`,
        bar,
        '',
        `<b>Trend:</b> ${escHtml(t.direction)}`,
        `  7d: ${t.change7d >= 0 ? '+' : ''}${t.change7d} · 30d: ${t.change30d >= 0 ? '+' : ''}${t.change30d}`,
        '',
        '<i>Data via cryptocurrency.cv</i>',
      ];

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('📊 Market', 'menu:market').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'trending': {
      const data = await apiFetch<{
        trending: Array<{ topic: string; count: number; sentiment: string; recentHeadlines: string[] }>;
        articlesAnalyzed: number;
      }>('/api/trending', { limit: 8, hours: 24 });

      const lines = ['🔥 <b>Trending (24h)</b>', ''];
      for (let i = 0; i < (data.trending?.length || 0); i++) {
        const t = data.trending[i];
        lines.push(`<b>${i + 1}.</b> ${escHtml(t.topic)} ${sentimentEmoji(t.sentiment)}  <i>(${t.count})</i>`);
      }
      lines.push('', `<i>${data.articlesAnalyzed} analyzed · cryptocurrency.cv</i>`);

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('📊 Market', 'menu:market').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'sentiment': {
      await navigateMenu(ctx, 'sentiment');
      break;
    }

    case 'whales': {
      const data = await apiFetch<{
        alerts: Array<{ symbol: string; amountUsd: number; from: { owner?: string }; to: { owner?: string }; transactionType: string; significance: string; blockchain: string }>;
        summary: { totalTransactions: number; totalValueUsd: number };
      }>('/api/whale-alerts', { limit: 5, minValue: 500000 });

      const typeE: Record<string, string> = { exchange_deposit: '📥', exchange_withdrawal: '📤', whale_transfer: '🐋' };
      const sigE: Record<string, string> = { massive: '🔴', notable: '🟡', normal: '⚪' };

      const lines = ['🐋 <b>Whale Alerts</b>', ''];
      for (const a of data.alerts || []) {
        lines.push(`${sigE[a.significance] || '⚪'}${typeE[a.transactionType] || '❓'} <b>${fmtUsd(a.amountUsd)}</b> ${escHtml(a.symbol)}`);
        lines.push(`   ${escHtml(a.from.owner || 'Unknown')} → ${escHtml(a.to.owner || 'Unknown')}`);
      }
      if (data.summary) {
        lines.push('', `<b>Total:</b> ${data.summary.totalTransactions} txns · ${fmtUsd(data.summary.totalValueUsd)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🐋 On-Chain', 'menu:onchain').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'digest': {
      const data = await apiFetch<{
        date: string;
        sections: Array<{ tag: string; headline: string; summary: string }>;
      }>('/api/digest', { format: 'ai-digest', period: '24h' });

      const emoji: Record<string, string> = { bitcoin: '₿', ethereum: '⟠', defi: '🏦', nft: '🖼️', regulation: '⚖️', market: '📈', solana: '◎' };
      const lines = [`📋 <b>Daily Digest</b> · ${escHtml(data.date)}`, ''];
      for (const s of (data.sections || []).slice(0, 5)) {
        lines.push(`${emoji[s.tag] || '📌'} <b>${escHtml(s.headline)}</b>`);
        lines.push(escHtml(s.summary), '');
      }
      lines.push('<i>AI-generated · cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: new InlineKeyboard().text('🤖 AI Tools', 'menu:ai').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'defi': {
      const data = await apiFetch<{
        protocols: Array<{ name: string; tvl: number; change24h: number; category: string }>;
        totalTvl: number;
      }>('/api/defi', { limit: 8 });

      const lines = ['🏦 <b>DeFi Overview</b>', '', `<b>Total TVL:</b> ${fmtUsd(data.totalTvl || 0)}`, ''];
      for (const p of data.protocols || []) {
        lines.push(`• <b>${escHtml(p.name)}</b>: ${fmtUsd(p.tvl)}  ${fmtPct(p.change24h)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🐋 On-Chain', 'menu:onchain').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'stablecoins': {
      const data = await apiFetch<{
        stablecoins: Array<{ name: string; symbol: string; marketCap: number; peg: number; change7d: number }>;
      }>('/api/stablecoins', { limit: 6 });

      const lines = ['💵 <b>Stablecoins</b>', ''];
      for (const s of data.stablecoins || []) {
        const pegStatus = Math.abs(s.peg - 1) < 0.005 ? '✅' : '⚠️';
        lines.push(`${pegStatus} <b>${escHtml(s.symbol)}</b>: ${fmtUsd(s.marketCap)} mcap · $${s.peg.toFixed(4)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('📊 Market', 'menu:market').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'l2': {
      const data = await apiFetch<{
        chains: Array<{ name: string; tvl: number; change7d: number; tps: number }>;
      }>('/api/l2', { limit: 8 });

      const lines = ['🧱 <b>Layer 2 Networks</b>', ''];
      for (const c of data.chains || []) {
        lines.push(`• <b>${escHtml(c.name)}</b>: ${fmtUsd(c.tvl)} TVL  ${fmtPct(c.change7d)} 7d`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🐋 On-Chain', 'menu:onchain').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'unlocks': {
      const data = await apiFetch<{
        unlocks: Array<{ token: string; date: string; valueUsd: number; percentOfSupply: number }>;
      }>('/api/token-unlocks', { limit: 6 });

      const lines = ['🔓 <b>Upcoming Token Unlocks</b>', ''];
      for (const u of data.unlocks || []) {
        lines.push(`• <b>${escHtml(u.token)}</b>: ${fmtUsd(u.valueUsd)} (${u.percentOfSupply.toFixed(1)}%) · ${escHtml(u.date)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🐋 On-Chain', 'menu:onchain').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'gas': {
      const data = await apiFetch<{
        ethereum: { slow: number; standard: number; fast: number; baseFee: number };
      }>('/api/gas', {});

      const g = data.ethereum || { slow: 0, standard: 0, fast: 0, baseFee: 0 };
      const lines = [
        '⛽ <b>Gas Tracker</b>', '',
        `🐢 Slow: <b>${g.slow}</b> gwei`,
        `🚶 Standard: <b>${g.standard}</b> gwei`,
        `🚀 Fast: <b>${g.fast}</b> gwei`,
        `📊 Base Fee: <b>${g.baseFee}</b> gwei`,
        '', '<i>cryptocurrency.cv</i>',
      ];

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🐋 On-Chain', 'menu:onchain').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'funding': {
      const data = await apiFetch<{
        rates: Array<{ symbol: string; rate: number; predictedRate: number; exchange: string }>;
      }>('/api/funding-rates', { limit: 8 });

      const lines = ['📈 <b>Funding Rates</b>', ''];
      for (const r of data.rates || []) {
        const emoji = r.rate >= 0 ? '🟢' : '🔴';
        lines.push(`${emoji} <b>${escHtml(r.symbol)}</b>: ${(r.rate * 100).toFixed(4)}% · ${escHtml(r.exchange)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('📊 Market', 'menu:market').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'macro': {
      const data = await apiFetch<{
        indicators: Array<{ name: string; value: string; change: string; impact: string }>;
      }>('/api/macro', {});

      const lines = ['🌐 <b>Macro Indicators</b>', ''];
      for (const i of data.indicators || []) {
        lines.push(`• <b>${escHtml(i.name)}</b>: ${escHtml(i.value)} (${escHtml(i.change)})`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('📊 Market', 'menu:market').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'predictions': {
      const data = await apiFetch<{
        predictions: Array<{ asset: string; prediction: string; confidence: number; timeframe: string }>;
      }>('/api/predictions', { limit: 5 });

      const lines = ['🔮 <b>AI Predictions</b>', ''];
      for (const p of data.predictions || []) {
        const emoji = p.prediction === 'bullish' ? '🟢' : p.prediction === 'bearish' ? '🔴' : '⚪';
        lines.push(`${emoji} <b>${escHtml(p.asset)}</b>: ${escHtml(p.prediction)} (${p.confidence}%) · ${escHtml(p.timeframe)}`);
      }
      lines.push('', '<i>AI-generated · cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🤖 AI Tools', 'menu:ai').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'briefing': {
      const data = await apiFetch<{
        briefing: string;
        generatedAt: string;
      }>('/api/ai/briefing', {});

      const lines = [
        '📡 <b>AI Briefing</b>', '',
        escHtml(data.briefing || 'No briefing available right now.'),
        '', '<i>AI-generated · cryptocurrency.cv</i>',
      ];

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('🤖 AI Tools', 'menu:ai').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'nftmarket': {
      const data = await apiFetch<{
        collections: Array<{ name: string; floorPrice: number; volume24h: number; change24h: number }>;
      }>('/api/nft', { limit: 6 });

      const lines = ['🖼️ <b>NFT Market</b>', ''];
      for (const c of data.collections || []) {
        lines.push(`• <b>${escHtml(c.name)}</b>: Floor ${fmtUsd(c.floorPrice)} · Vol ${fmtUsd(c.volume24h)}  ${fmtPct(c.change24h)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('⚙️ More', 'menu:more').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'gamingnews': {
      const data = await apiFetch<{
        articles: Array<{ title: string; link: string; source: string; pubDate?: string; timeAgo?: string }>;
        totalCount: number;
      }>('/api/news', { limit: 6, category: 'gaming' });

      const lines = ['🎮 <b>Gaming News</b>', '', ...data.articles.map(a => articleLine(a)), '', '<i>cryptocurrency.cv</i>'];

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: new InlineKeyboard().text('⚙️ More', 'menu:more').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'airdrops': {
      const data = await apiFetch<{
        airdrops: Array<{ name: string; status: string; value: string; deadline: string }>;
      }>('/api/airdrops', { limit: 6 });

      const lines = ['📰 <b>Airdrops</b>', ''];
      for (const a of data.airdrops || []) {
        const status = a.status === 'active' ? '🟢' : '⏳';
        lines.push(`${status} <b>${escHtml(a.name)}</b>: ${escHtml(a.value)} · ${escHtml(a.deadline)}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('⚙️ More', 'menu:more').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'exchanges': {
      const data = await apiFetch<{
        exchanges: Array<{ name: string; volume24h: number; trust_score: number }>;
      }>('/api/exchanges', { limit: 8 });

      const lines = ['🏛️ <b>Top Exchanges</b>', ''];
      for (let i = 0; i < (data.exchanges?.length || 0); i++) {
        const e = data.exchanges[i];
        const stars = '⭐'.repeat(Math.min(Math.round(e.trust_score / 2), 5));
        lines.push(`<b>${i + 1}.</b> ${escHtml(e.name)}: ${fmtUsd(e.volume24h)} vol ${stars}`);
      }
      lines.push('', '<i>cryptocurrency.cv</i>');

      await ctx.editMessageText(lines.join('\n'), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().text('⚙️ More', 'menu:more').text('« Main', 'menu:main'),
      });
      break;
    }

    case 'ask': {
      await ctx.editMessageText(
        '🤖 <b>Ask AI</b>\n\nSend me a question as a regular message:\n\n<code>/ask What happened with Bitcoin today?</code>',
        {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text('🤖 AI Tools', 'menu:ai').text('« Main', 'menu:main'),
        },
      );
      break;
    }

    case 'search': {
      await ctx.editMessageText(
        '🔍 <b>Search</b>\n\nUse the search command:\n\n<code>/search ethereum upgrade</code>',
        {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text('🤖 AI Tools', 'menu:ai').text('« Main', 'menu:main'),
        },
      );
      break;
    }

    case 'help': {
      await ctx.editMessageText(
        '📰 <b>Free Crypto News Bot</b>\n\n' +
        'Use the buttons above or type commands directly:\n\n' +
        '/news · /breaking · /price · /sentiment\n' +
        '/fear · /trending · /digest · /whales\n' +
        '/ask · /search · /menu\n\n' +
        '<i>cryptocurrency.cv · 200+ sources</i>',
        {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text('📰 Main Menu', 'menu:main'),
        },
      );
      break;
    }

    default:
      await ctx.editMessageText('⚠️ Feature coming soon!', {
        parse_mode: 'HTML',
        reply_markup: backButton,
      });
  }
}
