/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Price arithmetic.
 *
 * The x402 discovery contract quotes a price twice, in two different units: the
 * OpenAPI document uses decimal USD (`"0.001"`) and the runtime challenge uses
 * the asset's atomic units (`"1000"` for 6-decimal USDC). Nothing in the
 * protocol forces them to agree, and when they disagree the failure is silent
 * and expensive: an agent budgets from the document and settles from the wire.
 *
 * @module money
 */

/** Decimal places for assets we can name. Keyed by lowercased address. */
const KNOWN_ASSET_DECIMALS: Record<string, { decimals: number; symbol: string }> = {
  // USDC
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { decimals: 6, symbol: 'USDC' }, // Arbitrum One
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { decimals: 6, symbol: 'USDC' }, // Base
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': { decimals: 6, symbol: 'USDC' }, // Base Sepolia
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { decimals: 6, symbol: 'USDC' }, // Ethereum
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { decimals: 6, symbol: 'USDC' }, // Polygon
  '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { decimals: 6, symbol: 'USDC' }, // Optimism
  // USDT
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { decimals: 6, symbol: 'USDT' }, // Arbitrum One
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { decimals: 6, symbol: 'USDT' }, // Ethereum
};

/** Decimal places an ERC-20 stablecoin plausibly uses. */
const PLAUSIBLE_DECIMALS = new Set([2, 4, 6, 8, 9, 18]);

export function knownAsset(address: string | undefined): { decimals: number; symbol: string } | undefined {
  if (!address) return undefined;
  return KNOWN_ASSET_DECIMALS[address.toLowerCase()];
}

/** True when a string is a non-negative integer with no exponent or separator. */
export function isAtomicInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

/** True when a string looks like decimal dollars rather than atomic units. */
export function looksLikeDecimal(value: string): boolean {
  return /^\d*\.\d+$/.test(value);
}

/**
 * Recover the token's decimal places from a declared USD price and the atomic
 * amount charged for it.
 *
 * This is what lets the auditor check price agreement without an exhaustive
 * asset registry: for any honest pair the ratio is exactly a power of ten, and
 * its exponent is the token's decimals. A pair that yields a non-integer
 * exponent, or one outside the plausible set, is a real disagreement rather
 * than an unknown token.
 *
 * @returns the implied decimals, or null when the ratio is not a power of ten
 */
export function impliedDecimals(usd: number, atomic: string): number | null {
  if (!(usd > 0) || !isAtomicInteger(atomic)) return null;
  const units = Number(atomic);
  if (!Number.isFinite(units) || units <= 0) return null;
  const exponent = Math.log10(units / usd);
  const rounded = Math.round(exponent);
  // Floating point makes the ratio land a hair off a clean power of ten.
  if (Math.abs(exponent - rounded) > 1e-6) return null;
  return rounded;
}

export function isPlausibleDecimals(decimals: number): boolean {
  return PLAUSIBLE_DECIMALS.has(decimals);
}

/** Convert atomic units back to decimal USD for a human-readable message. */
export function atomicToDecimal(atomic: string, decimals: number): string {
  if (!isAtomicInteger(atomic)) return atomic;
  const padded = atomic.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals) || '0';
  const fraction = decimals > 0 ? padded.slice(padded.length - decimals) : '';
  const trimmed = fraction.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/** Format a USD amount the way a price is normally written. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const fixed = value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return `$${fixed || '0'}`;
}
