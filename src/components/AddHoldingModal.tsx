/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/components/portfolio";

/* ------------------------------------------------------------------ */
/*  Popular coins list (used for search/select)                        */
/* ------------------------------------------------------------------ */

const POPULAR_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "tron", name: "TRON", symbol: "TRX" },
  { id: "polygon-ecosystem-token", name: "POL (Polygon)", symbol: "POL" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI" },
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "cosmos", name: "Cosmos", symbol: "ATOM" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR" },
  { id: "aptos", name: "Aptos", symbol: "APT" },
  { id: "sui", name: "Sui", symbol: "SUI" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface AddHoldingModalProps {
  trigger?: React.ReactNode;
}

export function AddHoldingModal({ trigger }: AddHoldingModalProps) {
  const { addHolding } = usePortfolio();
  const [open, setOpen] = useState(false);

  /* form state */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<(typeof POPULAR_COINS)[number] | null>(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [...POPULAR_COINS];
    const q = searchQuery.toLowerCase();
    return POPULAR_COINS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.id.includes(q),
    );
  }, [searchQuery]);

  const reset = useCallback(() => {
    setSearchQuery("");
    setSelectedCoin(null);
    setAmount("");
    setBuyPrice("");
    setShowDropdown(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCoin) return;
      const a = parseFloat(amount);
      const p = parseFloat(buyPrice);
      if (Number.isNaN(a) || a <= 0 || Number.isNaN(p) || p <= 0) return;
      addHolding(selectedCoin.id, selectedCoin.name, selectedCoin.symbol, a, p);
      reset();
      setOpen(false);
    },
    [selectedCoin, amount, buyPrice, addHolding, reset],
  );

  const isValid =
    selectedCoin !== null &&
    !Number.isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    !Number.isNaN(parseFloat(buyPrice)) &&
    parseFloat(buyPrice) > 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add Holding
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-(--color-surface) p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold">Add Holding</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 hover:bg-surface-secondary transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coin selector */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1.5">Coin</label>
              {selectedCoin ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-secondary px-3 py-2">
                  <span className="font-medium">
                    {selectedCoin.name}{" "}
                    <span className="text-text-secondary">({selectedCoin.symbol})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCoin(null); setSearchQuery(""); }}
                    className="rounded p-0.5 hover:bg-border transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search coins…"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full rounded-md border border-border bg-(--color-surface) pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-(--color-surface) shadow-lg">
                      {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-text-secondary">No coins found</li>
                      ) : (
                        filtered.map((coin) => (
                          <li key={coin.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-secondary transition-colors text-left"
                              onClick={() => {
                                setSelectedCoin(coin);
                                setSearchQuery(coin.name);
                                setShowDropdown(false);
                              }}
                            >
                              <span className="font-medium">{coin.name}</span>
                              <span className="text-text-secondary">{coin.symbol}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Buy Price */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Buy Price (USD)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className={cn("w-full", !isValid && "opacity-50 pointer-events-none")}
              disabled={!isValid}
            >
              <Plus className="h-4 w-4" />
              Add to Portfolio
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
