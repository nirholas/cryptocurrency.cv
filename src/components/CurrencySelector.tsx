'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type Currency =
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'aud'
  | 'cad'
  | 'chf'
  | 'cny'
  | 'inr'
  | 'krw'
  | 'btc'
  | 'eth';

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'aud', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'cad', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'chf', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'cny', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'inr', symbol: '₹', name: 'Indian Rupee' },
  { code: 'krw', symbol: '₩', name: 'South Korean Won' },
  { code: 'btc', symbol: '₿', name: 'Bitcoin' },
  { code: 'eth', symbol: 'Ξ', name: 'Ethereum' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  symbol: string;
  rates: Record<string, number>;
  convert: (usdValue: number) => number;
  format: (usdValue: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Return defaults if provider not found
    return {
      currency: 'usd' as Currency,
      setCurrency: () => {},
      symbol: '$',
      rates: {},
      convert: (v: number) => v,
      format: (v: number) => `$${v.toLocaleString()}`,
    };
  }
  return ctx;
}

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>('usd');
  const [rates, setRates] = useState<Record<string, number>>({});

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('preferred-currency');
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyState(saved as Currency);
    }
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('/api/exchange-rates', {
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          const btcRates = data.rates;
          // Convert all rates relative to USD
          const usdRate = btcRates.usd?.value || 1;
          const normalized: Record<string, number> = {};
          for (const [key, val] of Object.entries(btcRates)) {
            normalized[key] = (val as { value: number }).value / usdRate;
          }
          setRates(normalized);
        }
      } catch (e) {
        console.error('Failed to fetch exchange rates:', e);
      }
    }
    fetchRates();
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('preferred-currency', c);
  };

  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const convert = (usdValue: number): number => {
    if (currency === 'usd' || !rates[currency]) return usdValue;
    return usdValue * rates[currency];
  };

  const format = (usdValue: number, decimals?: number): string => {
    const converted = convert(usdValue);
    const sym = currencyInfo.symbol;

    // Handle different decimal requirements
    let dec = decimals;
    if (dec === undefined) {
      if (currency === 'btc' || currency === 'eth') {
        dec = converted < 0.0001 ? 8 : converted < 1 ? 6 : 4;
      } else if (currency === 'jpy' || currency === 'krw') {
        dec = 0;
      } else {
        dec = converted >= 1000 ? 0 : converted >= 1 ? 2 : converted >= 0.01 ? 4 : 6;
      }
    }

    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });

    return `${sym}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, symbol: currencyInfo.symbol, rates, convert, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// Dropdown selector component
export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const current = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-black transition-colors"
        aria-label="Select currency"
      >
        <span>{current.symbol}</span>
        <span className="uppercase">{current.code}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 max-h-80 overflow-y-auto">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-black transition-colors ${
                  currency === c.code ? 'bg-gray-100 dark:bg-black' : ''
                }`}
              >
                <span className="w-6 text-center font-medium">{c.symbol}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="uppercase text-gray-500 dark:text-gray-400 text-xs">
                  {c.code}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
