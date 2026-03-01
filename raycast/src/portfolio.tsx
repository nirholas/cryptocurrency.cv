/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useEffect, useState } from "react";
import {
  Detail,
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  LocalStorage,
  showToast,
  Toast,
  Form,
  useNavigation,
  getPreferenceValues,
} from "@raycast/api";

const API_BASE =
  (getPreferenceValues<{ apiBaseUrl?: string }>().apiBaseUrl as string) ||
  "https://cryptocurrency.cv/api";

const STORAGE_KEY = "crypto-portfolio";

interface Holding {
  symbol: string;
  amount: number;
}

interface PriceEntry {
  usd: number;
  change24h: number;
}

// ---------------------------------------------------------------------------
// Add holding form
// ---------------------------------------------------------------------------

function AddHoldingForm(props: { onAdd: (h: Holding) => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Holding"
            onSubmit={(values: Form.Values) => {
              const symbol = (values.symbol as string).trim().toLowerCase();
              const amount = parseFloat(values.amount as string);
              if (!symbol || isNaN(amount) || amount <= 0) {
                showToast(Toast.Style.Failure, "Invalid input");
                return;
              }
              props.onAdd({ symbol, amount });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="symbol" title="Coin Symbol" placeholder="e.g. btc" />
      <Form.TextField id="amount" title="Amount" placeholder="e.g. 0.5" />
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  // Load holdings from local storage
  useEffect(() => {
    (async () => {
      const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
      if (raw) {
        try {
          setHoldings(JSON.parse(raw));
        } catch {
          setHoldings([]);
        }
      } else {
        setHoldings([]);
      }
    })();
  }, []);

  // Fetch prices when holdings change
  useEffect(() => {
    if (!holdings || holdings.length === 0) {
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const symbols = holdings.map((h) => h.symbol).join(",");
        const res = await fetch(`${API_BASE}/prices?coins=${encodeURIComponent(symbols)}`);
        if (res.ok) {
          const data = (await res.json()) as { prices?: Record<string, PriceEntry> };
          setPrices(data.prices || {});
        }
      } catch {
        // silently fail — prices just won't show
      } finally {
        setIsLoading(false);
      }
    })();
  }, [holdings]);

  const saveHoldings = async (next: Holding[]) => {
    setHoldings(next);
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addHolding = (h: Holding) => {
    const next = [...(holdings || [])];
    const existing = next.find((x) => x.symbol === h.symbol);
    if (existing) {
      existing.amount += h.amount;
    } else {
      next.push(h);
    }
    saveHoldings(next);
  };

  const removeHolding = (symbol: string) => {
    saveHoldings((holdings || []).filter((h) => h.symbol !== symbol));
  };

  // Empty state
  if (holdings !== null && holdings.length === 0) {
    return (
      <Detail
        isLoading={isLoading}
        markdown={`# 📂 Portfolio\n\nNo holdings yet.\n\nPress **⌘ N** to add your first coin.`}
        actions={
          <ActionPanel>
            <Action
              title="Add Holding"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={() => push(<AddHoldingForm onAdd={addHolding} />)}
            />
          </ActionPanel>
        }
      />
    );
  }

  // Compute totals
  let totalValue = 0;
  const rows = (holdings || []).map((h) => {
    const p = prices[h.symbol] || prices[h.symbol.toUpperCase()];
    const value = p ? h.amount * p.usd : 0;
    totalValue += value;
    return { ...h, price: p, value };
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter holdings…">
      <List.Section title={`Portfolio — $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
        {rows.map((row, i) => {
          const change = row.price?.change24h ?? 0;
          const positive = change >= 0;
          return (
            <List.Item
              key={i}
              icon={Icon.Coins}
              title={row.symbol.toUpperCase()}
              subtitle={`${row.amount} coins`}
              accessories={[
                { text: `$${row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                {
                  tag: {
                    value: `${positive ? "+" : ""}${change.toFixed(2)}%`,
                    color: positive ? Color.Green : Color.Red,
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Add Holding"
                    icon={Icon.Plus}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    onAction={() => push(<AddHoldingForm onAdd={addHolding} />)}
                  />
                  <Action
                    title="Remove Holding"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                    onAction={() => removeHolding(row.symbol)}
                  />
                  <Action.OpenInBrowser
                    title="View Coin"
                    url={`https://cryptocurrency.cv/coin/${row.symbol}`}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
