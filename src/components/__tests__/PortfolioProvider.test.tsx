/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioProvider, usePortfolio } from "@/components/portfolio";

function PortfolioTester() {
  const {
    holdings,
    addHolding,
    removeHolding,
    updateHolding,
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
  } = usePortfolio();

  return (
    <div>
      <span data-testid="count">{holdings.length}</span>
      <span data-testid="total-value">{totalValue.toFixed(2)}</span>
      <span data-testid="total-cost">{totalCost.toFixed(2)}</span>
      <span data-testid="total-pnl">{totalPnL.toFixed(2)}</span>
      <span data-testid="total-pnl-pct">{totalPnLPercent.toFixed(2)}</span>
      <button onClick={() => addHolding("bitcoin", "Bitcoin", "BTC", 1, 40000)}>Add BTC</button>
      <button onClick={() => addHolding("ethereum", "Ethereum", "ETH", 10, 2000)}>Add ETH</button>
      <button onClick={() => {
        if (holdings.length > 0) removeHolding(holdings[0].id);
      }}>Remove First</button>
      <button onClick={() => {
        if (holdings.length > 0) updateHolding(holdings[0].id, { amount: 2 });
      }}>Update First Amount</button>
      <ul>
        {holdings.map((h) => (
          <li key={h.id} data-testid={`holding-${h.coinId}`}>
            {h.symbol} x{h.amount} @{h.buyPrice}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe("PortfolioProvider", () => {
  let localStore: Record<string, string>;

  beforeEach(() => {
    localStore = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => localStore[key] ?? null,
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        localStore[key] = value;
      },
    );
    // Mock fetch for price polling — return empty to avoid noise
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with no holdings", () => {
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("total-value")).toHaveTextContent("0.00");
  });

  it("adds a holding", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("holding-bitcoin")).toHaveTextContent("BTC x1 @40000");
  });

  it("calculates total cost correctly", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC")); // 1 BTC @ $40,000
    await user.click(screen.getByText("Add ETH")); // 10 ETH @ $2,000
    // Total cost: 40,000 + 20,000 = 60,000
    expect(screen.getByTestId("total-cost")).toHaveTextContent("60000.00");
  });

  it("calculates PnL as 0 when no market prices (uses buy price as fallback)", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC"));
    // With no live prices, value = amount * buyPrice = 40,000, cost = 40,000 → PnL = 0
    expect(screen.getByTestId("total-pnl")).toHaveTextContent("0.00");
    expect(screen.getByTestId("total-pnl-pct")).toHaveTextContent("0.00");
  });

  it("removes a holding", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByText("Remove First"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("updates a holding amount", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC"));
    await user.click(screen.getByText("Update First Amount"));
    expect(screen.getByTestId("holding-bitcoin")).toHaveTextContent("BTC x2 @40000");
  });

  it("persists holdings to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await user.click(screen.getByText("Add BTC"));

    await vi.waitFor(() => {
      expect(localStore["fcn-portfolio"]).toBeDefined();
    });
    const saved = JSON.parse(localStore["fcn-portfolio"]);
    expect(saved).toHaveLength(1);
    expect(saved[0].coinId).toBe("bitcoin");
  });

  it("hydrates from localStorage on mount", async () => {
    localStore["fcn-portfolio"] = JSON.stringify([
      {
        id: "test-id",
        coinId: "bitcoin",
        coinName: "Bitcoin",
        symbol: "BTC",
        amount: 5,
        buyPrice: 35000,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    render(
      <PortfolioProvider>
        <PortfolioTester />
      </PortfolioProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("holding-bitcoin")).toHaveTextContent("BTC x5 @35000");
  });

  it("throws when usePortfolio is used outside provider", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<PortfolioTester />)).toThrow(
      "usePortfolio must be used within <PortfolioProvider>",
    );
    spy.mockRestore();
  });
});
