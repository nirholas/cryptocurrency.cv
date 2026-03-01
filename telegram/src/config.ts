/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const API_BASE = process.env.FCN_API_BASE ?? 'https://cryptocurrency.cv/api';
export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID ?? ''; // optional: @YourChannel
export const BROADCAST_INTERVAL_MS = Number(process.env.BROADCAST_INTERVAL_MS) || 5 * 60 * 1000; // 5 min
export const VERSION = '1.0.0';
export const USER_AGENT = `fcn-telegram-bot/${VERSION}`;
