/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Validation for trading symbols that callers pass to provider chains.
 *
 * Adapters build upstream URLs from `FetchParams.symbols` (CoinGlass, OKX,
 * Kraken and others), so a symbol taken from a query string must not carry
 * `&`, `/`, `?` or `#`. Routes check with {@link isTradingSymbol} and answer
 * 400 before any provider is called.
 *
 * @module providers/symbols
 */

/** `BTC`, `BTCUSDT`, `BTC-USD`, `1000PEPE`: letters and digits, optional hyphens. */
const TRADING_SYMBOL_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,29}$/;

export function isTradingSymbol(value: string): boolean {
  return TRADING_SYMBOL_RE.test(value);
}
