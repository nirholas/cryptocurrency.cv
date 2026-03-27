/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NewsCard, {
  FeaturedCard,
  NewsCardDefault,
  NewsCardCompact,
  NewsCardHeadline,
} from "@/components/NewsCard";
import type { NewsArticle } from "@/lib/crypto-news";

// Mock BookmarkButton to avoid pulling in context dependencies
vi.mock("@/components/BookmarkButton", () => ({
  BookmarkButton: ({ article }: { article: { title: string } }) => (
    <button aria-label={`Bookmark ${article.title}`}>★</button>
  ),
}));

const mockArticle: NewsArticle = {
  title: "Bitcoin Surges Past $100K",
  link: "https://example.com/btc-100k",
  description: "Bitcoin has reached a new all-time high of $100,000 as institutional demand surges.",
  imageUrl: "https://example.com/btc.jpg",
  pubDate: new Date().toISOString(),
  source: "CoinDesk",
  sourceKey: "coindesk",
  category: "bitcoin",
  timeAgo: "2h ago",
};

const mockArticleMinimal: NewsArticle = {
  title: "Quick ETH Update",
  link: "https://example.com/eth-update",
  pubDate: new Date().toISOString(),
  source: "CoinTelegraph",
  sourceKey: "cointelegraph",
  category: "ethereum",
  timeAgo: "5m ago",
};

describe("FeaturedCard", () => {
  it("renders article title", () => {
    render(<FeaturedCard article={mockArticle} />);
    expect(screen.getByText("Bitcoin Surges Past $100K")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(<FeaturedCard article={mockArticle} />);
    expect(screen.getByText(/Bitcoin has reached/)).toBeInTheDocument();
  });

  it("renders source and time", () => {
    render(<FeaturedCard article={mockArticle} />);
    expect(screen.getByText(/CoinDesk/)).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<FeaturedCard article={mockArticle} />);
    expect(screen.getByText("bitcoin")).toBeInTheDocument();
  });

  it("links to the article", () => {
    render(<FeaturedCard article={mockArticle} />);
    const links = screen.getAllByRole("link");
    const articleLink = links.find(
      (l) => l.getAttribute("href") === mockArticle.link
    );
    expect(articleLink).toBeDefined();
    expect(articleLink).toHaveAttribute("href", mockArticle.link);
  });

  it("renders article image", () => {
    render(<FeaturedCard article={mockArticle} />);
    const img = screen.getByAltText("Bitcoin Surges Past $100K");
    expect(img).toBeInTheDocument();
  });
});

describe("NewsCardDefault", () => {
  it("renders article title in h3", () => {
    render(<NewsCardDefault article={mockArticle} />);
    const heading = screen.getByText("Bitcoin Surges Past $100K");
    expect(heading.tagName).toBe("H3");
  });

  it("renders without description", () => {
    render(<NewsCardDefault article={mockArticleMinimal} />);
    expect(screen.getByText("Quick ETH Update")).toBeInTheDocument();
  });
});

describe("NewsCardCompact", () => {
  it("renders compact layout with title", () => {
    render(<NewsCardCompact article={mockArticle} />);
    expect(screen.getByText("Bitcoin Surges Past $100K")).toBeInTheDocument();
  });

  it("renders source metadata", () => {
    render(<NewsCardCompact article={mockArticle} />);
    expect(screen.getByText(/CoinDesk/)).toBeInTheDocument();
  });
});

describe("NewsCardHeadline", () => {
  it("renders title as text-only headline", () => {
    render(<NewsCardHeadline article={mockArticle} />);
    expect(screen.getByText("Bitcoin Surges Past $100K")).toBeInTheDocument();
  });

  it("renders index when provided", () => {
    render(<NewsCardHeadline article={mockArticle} index={0} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("renders index padded to 2 digits", () => {
    render(<NewsCardHeadline article={mockArticle} index={9} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("does not render index when not provided", () => {
    render(<NewsCardHeadline article={mockArticle} />);
    expect(screen.queryByText("01")).not.toBeInTheDocument();
  });
});

describe("NewsCard (default export)", () => {
  it('renders featured variant', () => {
    render(<NewsCard article={mockArticle} variant="featured" />);
    // Featured card uses h2
    const heading = screen.getByText("Bitcoin Surges Past $100K");
    expect(heading.tagName).toBe("H2");
  });

  it('renders default variant', () => {
    render(<NewsCard article={mockArticle} variant="default" />);
    const heading = screen.getByText("Bitcoin Surges Past $100K");
    expect(heading.tagName).toBe("H3");
  });

  it('renders compact variant', () => {
    render(<NewsCard article={mockArticle} variant="compact" />);
    expect(screen.getByText("Bitcoin Surges Past $100K")).toBeInTheDocument();
  });

  it('renders headline variant', () => {
    render(<NewsCard article={mockArticle} variant="headline" />);
    expect(screen.getByText("Bitcoin Surges Past $100K")).toBeInTheDocument();
  });

  it("defaults to default variant when unspecified", () => {
    render(<NewsCard article={mockArticle} />);
    const heading = screen.getByText("Bitcoin Surges Past $100K");
    expect(heading.tagName).toBe("H3");
  });
});
