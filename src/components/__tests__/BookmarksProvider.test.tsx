/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarksProvider, useBookmarks } from "@/components/BookmarksProvider";

function BookmarksTester() {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked, clearAll } = useBookmarks();
  return (
    <div>
      <span data-testid="count">{bookmarks.length}</span>
      <span data-testid="is-bookmarked">{isBookmarked("https://example.com/1") ? "yes" : "no"}</span>
      <button onClick={() => addBookmark({ link: "https://example.com/1", title: "Article 1", source: "CoinDesk", category: "bitcoin" })}>
        Add 1
      </button>
      <button onClick={() => addBookmark({ link: "https://example.com/2", title: "Article 2", source: "CoinTelegraph", category: "ethereum" })}>
        Add 2
      </button>
      <button onClick={() => removeBookmark("https://example.com/1")}>Remove 1</button>
      <button onClick={() => clearAll()}>Clear All</button>
      <ul>
        {bookmarks.map((b) => (
          <li key={b.link}>{b.title}</li>
        ))}
      </ul>
    </div>
  );
}

describe("BookmarksProvider", () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with no bookmarks", () => {
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("adds a bookmark", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await user.click(screen.getByText("Add 1"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByText("Article 1")).toBeInTheDocument();
  });

  it("prevents duplicate bookmarks", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await user.click(screen.getByText("Add 1"));
    await user.click(screen.getByText("Add 1"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("reports isBookmarked correctly", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    expect(screen.getByTestId("is-bookmarked")).toHaveTextContent("no");
    await user.click(screen.getByText("Add 1"));
    expect(screen.getByTestId("is-bookmarked")).toHaveTextContent("yes");
  });

  it("removes a bookmark", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await user.click(screen.getByText("Add 1"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByText("Remove 1"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("clears all bookmarks", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await user.click(screen.getByText("Add 1"));
    await user.click(screen.getByText("Add 2"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");

    await user.click(screen.getByText("Clear All"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("persists bookmarks to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await user.click(screen.getByText("Add 1"));

    // Wait for the persist effect
    await vi.waitFor(() => {
      expect(localStore["fcn-bookmarks"]).toBeDefined();
    });
    const saved = JSON.parse(localStore["fcn-bookmarks"]);
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe("Article 1");
  });

  it("hydrates from localStorage on mount", async () => {
    localStore["fcn-bookmarks"] = JSON.stringify([
      { link: "https://example.com/1", title: "Restored", source: "Test", category: "bitcoin", savedAt: "2026-01-01" },
    ]);

    render(
      <BookmarksProvider>
        <BookmarksTester />
      </BookmarksProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByText("Restored")).toBeInTheDocument();
  });
});
