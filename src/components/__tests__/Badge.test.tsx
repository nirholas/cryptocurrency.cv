/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
  });

  it("renders bitcoin variant", () => {
    render(<Badge variant="bitcoin">BTC</Badge>);
    const badge = screen.getByText("BTC");
    expect(badge.className).toContain("cat-bitcoin");
  });

  it("renders ethereum variant", () => {
    render(<Badge variant="ethereum">ETH</Badge>);
    expect(screen.getByText("ETH").className).toContain("cat-ethereum");
  });

  it("renders live variant", () => {
    render(<Badge variant="live">LIVE</Badge>);
    const badge = screen.getByText("LIVE");
    expect(badge.className).toContain("red");
  });

  it("renders breaking variant", () => {
    render(<Badge variant="breaking">BREAKING</Badge>);
    const badge = screen.getByText("BREAKING");
    expect(badge.className).toContain("bg-red-600");
  });

  it("merges custom className", () => {
    render(<Badge className="my-custom">Custom</Badge>);
    expect(screen.getByText("Custom").className).toContain("my-custom");
  });

  it("passes through HTML attributes", () => {
    render(<Badge data-testid="test-badge">Test</Badge>);
    expect(screen.getByTestId("test-badge")).toBeInTheDocument();
  });
});

describe("categoryToBadgeVariant()", () => {
  it('maps "bitcoin" → "bitcoin"', () => {
    expect(categoryToBadgeVariant("bitcoin")).toBe("bitcoin");
  });

  it('maps "Ethereum" → "ethereum" (case insensitive)', () => {
    expect(categoryToBadgeVariant("Ethereum")).toBe("ethereum");
  });

  it('maps "defi" → "defi"', () => {
    expect(categoryToBadgeVariant("defi")).toBe("defi");
  });

  it('maps "NFT" → "nft" (case insensitive)', () => {
    expect(categoryToBadgeVariant("NFT")).toBe("nft");
  });

  it('maps "regulation" → "regulation"', () => {
    expect(categoryToBadgeVariant("regulation")).toBe("regulation");
  });

  it('maps unknown categories to "default"', () => {
    expect(categoryToBadgeVariant("unknown-category")).toBe("default");
  });

  it('maps "Trading" → "trading"', () => {
    expect(categoryToBadgeVariant("Trading")).toBe("trading");
  });

  it('maps "mining" → "mining"', () => {
    expect(categoryToBadgeVariant("mining")).toBe("mining");
  });

  it('maps "web3" → "web3"', () => {
    expect(categoryToBadgeVariant("web3")).toBe("web3");
  });
});
