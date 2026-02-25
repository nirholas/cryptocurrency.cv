/**
 * Macro Provider Chains — Centralized chain exports for macro/tradfi data
 *
 * Chains:
 * - `macroChain` — Macro indicators from FRED, Alpha Vantage, Twelve Data
 *
 * @module providers/chains/macro
 */

export {
  macroChain,
  createMacroChain,
} from '../adapters/macro';

export type { MacroData, MacroIndicator, MacroIndicatorId, CryptoMacroCorrelation } from '../adapters/macro';
