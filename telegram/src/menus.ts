/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { InlineKeyboard } from 'grammy';

// ---------------------------------------------------------------------------
// Inline keyboard menus — buttons within buttons
// ---------------------------------------------------------------------------

/** Main menu shown on /start or /menu */
export function mainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📰 News', 'menu:news').text('💰 Prices', 'menu:prices').row()
    .text('📊 Market', 'menu:market').text('🐋 On-Chain', 'menu:onchain').row()
    .text('🤖 AI Tools', 'menu:ai').text('⚙️ More', 'menu:more').row();
}

/** News sub-menu — pick a category */
export function newsMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('₿ Bitcoin', 'news:bitcoin').text('⟠ Ethereum', 'news:ethereum').row()
    .text('🏦 DeFi', 'news:defi').text('🖼️ NFT', 'news:nft').row()
    .text('◎ Solana', 'news:solana').text('⚖️ Regulation', 'news:regulation').row()
    .text('🎮 Gaming', 'news:gaming').text('🚨 Breaking', 'news:breaking').row()
    .text('📰 All Latest', 'news:all').row()
    .text('« Back', 'menu:main');
}

/** Prices sub-menu — pick coins */
export function pricesMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('₿ BTC', 'price:btc').text('⟠ ETH', 'price:eth').text('◎ SOL', 'price:sol').row()
    .text('🔶 BNB', 'price:bnb').text('✕ XRP', 'price:xrp').text('🐕 DOGE', 'price:doge').row()
    .text('🔗 LINK', 'price:link').text('🦄 UNI', 'price:uni').text('⚛️ ATOM', 'price:atom').row()
    .text('💎 TON', 'price:ton').text('🏔️ AVAX', 'price:avax').text('🐸 PEPE', 'price:pepe').row()
    .text('📊 Top 10', 'price:top10').row()
    .text('« Back', 'menu:main');
}

/** Market sub-menu */
export function marketMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('😱 Fear & Greed', 'cmd:fear').text('🔥 Trending', 'cmd:trending').row()
    .text('🧠 Sentiment', 'cmd:sentiment').text('💵 Stablecoins', 'cmd:stablecoins').row()
    .text('📈 Funding Rates', 'cmd:funding').text('🌐 Macro', 'cmd:macro').row()
    .text('« Back', 'menu:main');
}

/** On-chain sub-menu */
export function onchainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🐋 Whale Alerts', 'cmd:whales').text('🏦 DeFi Stats', 'cmd:defi').row()
    .text('🧱 Layer 2', 'cmd:l2').text('🔓 Token Unlocks', 'cmd:unlocks').row()
    .text('📊 Gas Tracker', 'cmd:gas').row()
    .text('« Back', 'menu:main');
}

/** AI tools sub-menu */
export function aiMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📋 Daily Digest', 'cmd:digest').text('🔮 Predictions', 'cmd:predictions').row()
    .text('🤖 Ask AI', 'cmd:ask').text('📡 Briefing', 'cmd:briefing').row()
    .text('🔍 Search', 'cmd:search').row()
    .text('« Back', 'menu:main');
}

/** More sub-menu */
export function moreMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🖼️ NFT Market', 'cmd:nftmarket').text('🎮 Gaming', 'cmd:gamingnews').row()
    .text('📰 Airdrops', 'cmd:airdrops').text('🏛️ Exchanges', 'cmd:exchanges').row()
    .text('ℹ️ Help', 'cmd:help').row()
    .text('« Back', 'menu:main');
}

/** Sentiment sub-menu — pick an asset */
export function sentimentMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Overall', 'sentiment:overall').row()
    .text('₿ BTC', 'sentiment:BTC').text('⟠ ETH', 'sentiment:ETH').text('◎ SOL', 'sentiment:SOL').row()
    .text('✕ XRP', 'sentiment:XRP').text('🐕 DOGE', 'sentiment:DOGE').text('🔗 LINK', 'sentiment:LINK').row()
    .text('« Back', 'menu:market');
}

// ---------------------------------------------------------------------------
// Menu text labels
// ---------------------------------------------------------------------------

export const MENU_TEXT: Record<string, string> = {
  main: '📰 <b>Crypto News Menu</b>\n\nChoose a category:',
  news: '📰 <b>News</b>\n\nPick a topic:',
  prices: '💰 <b>Prices</b>\n\nSelect a coin:',
  market: '📊 <b>Market Data</b>\n\nWhat would you like to see?',
  onchain: '🐋 <b>On-Chain</b>\n\nExplore on-chain data:',
  ai: '🤖 <b>AI Tools</b>\n\nPowered by AI:',
  more: '⚙️ <b>More</b>\n\nAdditional features:',
  sentiment: '🧠 <b>Sentiment</b>\n\nPick an asset:',
};

/** Get the keyboard for a menu by its key */
export function getMenu(key: string): InlineKeyboard | null {
  const menus: Record<string, () => InlineKeyboard> = {
    main: mainMenu,
    news: newsMenu,
    prices: pricesMenu,
    market: marketMenu,
    onchain: onchainMenu,
    ai: aiMenu,
    more: moreMenu,
    sentiment: sentimentMenu,
  };
  const factory = menus[key];
  return factory ? factory() : null;
}
