/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Simple JSON file-backed store for alerts & portfolio data
// ---------------------------------------------------------------------------

const DATA_DIR = process.env.FCN_DATA_DIR ?? join(process.cwd(), 'data');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function saveJson(file: string, data: unknown): void {
  ensureDir(dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Alert Subscriptions
// ---------------------------------------------------------------------------

export interface AlertSubscription {
  chatId: number;
  keyword: string;
  createdAt: string;
}

const alertsFile = () => join(DATA_DIR, 'alerts.json');

let alertsCache: AlertSubscription[] | null = null;

export function getAlerts(): AlertSubscription[] {
  if (!alertsCache) alertsCache = loadJson<AlertSubscription[]>(alertsFile(), []);
  return alertsCache;
}

export function getAlertsForChat(chatId: number): AlertSubscription[] {
  return getAlerts().filter(a => a.chatId === chatId);
}

export function addAlert(chatId: number, keyword: string): boolean {
  const alerts = getAlerts();
  const norm = keyword.toLowerCase().trim();
  if (!norm) return false;
  const exists = alerts.some(a => a.chatId === chatId && a.keyword === norm);
  if (exists) return false;
  alerts.push({ chatId, keyword: norm, createdAt: new Date().toISOString() });
  alertsCache = alerts;
  saveJson(alertsFile(), alerts);
  return true;
}

export function removeAlert(chatId: number, keyword: string): boolean {
  const alerts = getAlerts();
  const norm = keyword.toLowerCase().trim();
  const idx = alerts.findIndex(a => a.chatId === chatId && a.keyword === norm);
  if (idx === -1) return false;
  alerts.splice(idx, 1);
  alertsCache = alerts;
  saveJson(alertsFile(), alerts);
  return true;
}

export function removeAllAlerts(chatId: number): number {
  const alerts = getAlerts();
  const before = alerts.length;
  alertsCache = alerts.filter(a => a.chatId !== chatId);
  saveJson(alertsFile(), alertsCache);
  return before - alertsCache.length;
}

/** Get all unique keywords across all users (for polling) */
export function getAllKeywords(): string[] {
  return [...new Set(getAlerts().map(a => a.keyword))];
}

/** Get all chat IDs subscribed to a keyword */
export function getSubscribers(keyword: string): number[] {
  return getAlerts()
    .filter(a => a.keyword === keyword)
    .map(a => a.chatId);
}

// ---------------------------------------------------------------------------
// Portfolio Holdings
// ---------------------------------------------------------------------------

export interface PortfolioHolding {
  coin: string; // ticker e.g. "btc"
  amount: number;
  addedAt: string;
}

export interface UserPortfolio {
  chatId: number;
  holdings: PortfolioHolding[];
}

const portfolioFile = () => join(DATA_DIR, 'portfolios.json');

let portfolioCache: UserPortfolio[] | null = null;

function getPortfolios(): UserPortfolio[] {
  if (!portfolioCache) portfolioCache = loadJson<UserPortfolio[]>(portfolioFile(), []);
  return portfolioCache;
}

function savePortfolios(): void {
  saveJson(portfolioFile(), getPortfolios());
}

export function getPortfolio(chatId: number): PortfolioHolding[] {
  const p = getPortfolios().find(u => u.chatId === chatId);
  return p?.holdings ?? [];
}

export function addHolding(chatId: number, coin: string, amount: number): void {
  const portfolios = getPortfolios();
  let user = portfolios.find(u => u.chatId === chatId);
  if (!user) {
    user = { chatId, holdings: [] };
    portfolios.push(user);
  }
  const norm = coin.toLowerCase().trim();
  const existing = user.holdings.find(h => h.coin === norm);
  if (existing) {
    existing.amount += amount;
  } else {
    user.holdings.push({ coin: norm, amount, addedAt: new Date().toISOString() });
  }
  portfolioCache = portfolios;
  savePortfolios();
}

export function setHolding(chatId: number, coin: string, amount: number): void {
  const portfolios = getPortfolios();
  let user = portfolios.find(u => u.chatId === chatId);
  if (!user) {
    user = { chatId, holdings: [] };
    portfolios.push(user);
  }
  const norm = coin.toLowerCase().trim();
  const existing = user.holdings.find(h => h.coin === norm);
  if (existing) {
    existing.amount = amount;
  } else {
    user.holdings.push({ coin: norm, amount, addedAt: new Date().toISOString() });
  }
  portfolioCache = portfolios;
  savePortfolios();
}

export function removeHolding(chatId: number, coin: string): boolean {
  const portfolios = getPortfolios();
  const user = portfolios.find(u => u.chatId === chatId);
  if (!user) return false;
  const norm = coin.toLowerCase().trim();
  const idx = user.holdings.findIndex(h => h.coin === norm);
  if (idx === -1) return false;
  user.holdings.splice(idx, 1);
  portfolioCache = portfolios;
  savePortfolios();
  return true;
}

export function clearPortfolio(chatId: number): number {
  const portfolios = getPortfolios();
  const user = portfolios.find(u => u.chatId === chatId);
  if (!user) return 0;
  const count = user.holdings.length;
  user.holdings = [];
  portfolioCache = portfolios;
  savePortfolios();
  return count;
}
