/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

// Helper component to expose theme context
function ThemeDisplay() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("midnight")}>Midnight</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
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
    // Reset document class
    document.documentElement.classList.remove("dark", "midnight", "theme-transitioning");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to system theme", async () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    // After effect runs
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("applies dark theme on setTheme('dark')", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("Dark"));
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light theme on setTheme('light')", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("Light"));
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme choice to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("Dark"));
    expect(localStore["theme"]).toBe("dark");
  });

  it("reads stored theme from localStorage on mount", async () => {
    localStore["theme"] = "dark";
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );

    // After useEffect hydration
    await vi.waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
  });

  it("resolves system theme based on matchMedia (defaults to light in test env)", () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    // matchMedia mocked to return matches:false → light
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });

  it("applies midnight theme on setTheme('midnight')", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("Midnight"));
    expect(screen.getByTestId("resolved")).toHaveTextContent("midnight");
    expect(document.documentElement.classList.contains("midnight")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
