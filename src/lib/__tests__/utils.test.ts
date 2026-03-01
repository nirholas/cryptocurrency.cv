import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatTimeAgo, truncate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  cn()                                                               */
/* ------------------------------------------------------------------ */

describe("cn()", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("handles array syntax", () => {
    expect(cn(["a", "b"])).toBe("a b");
  });
});

/* ------------------------------------------------------------------ */
/*  formatTimeAgo()                                                    */
/* ------------------------------------------------------------------ */

describe("formatTimeAgo()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 60 seconds ago', () => {
    const date = new Date("2026-03-01T11:59:30Z").toISOString();
    expect(formatTimeAgo(date)).toBe("just now");
  });

  it("returns minutes ago for dates less than 1 hour ago", () => {
    const date = new Date("2026-03-01T11:30:00Z").toISOString();
    expect(formatTimeAgo(date)).toBe("30m ago");
  });

  it("returns hours ago for dates less than 24 hours ago", () => {
    const date = new Date("2026-03-01T06:00:00Z").toISOString();
    expect(formatTimeAgo(date)).toBe("6h ago");
  });

  it("returns days ago for dates less than 7 days ago", () => {
    const date = new Date("2026-02-27T12:00:00Z").toISOString();
    expect(formatTimeAgo(date)).toBe("2d ago");
  });

  it("returns a formatted date for dates older than 7 days (same year)", () => {
    const date = new Date("2026-01-15T12:00:00Z").toISOString();
    const result = formatTimeAgo(date);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    // Same year — no year in output
    expect(result).not.toContain("2026");
  });

  it("includes year for dates from a different year", () => {
    const date = new Date("2025-06-15T12:00:00Z").toISOString();
    const result = formatTimeAgo(date);
    expect(result).toContain("2025");
  });
});

/* ------------------------------------------------------------------ */
/*  truncate()                                                         */
/* ------------------------------------------------------------------ */

describe("truncate()", () => {
  it("returns original string if within maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns original string if exactly maxLength", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates string and adds ellipsis", () => {
    const result = truncate("hello world", 5);
    expect(result).toBe("hello…");
  });

  it("trims trailing whitespace before ellipsis", () => {
    const result = truncate("hello world and more", 6);
    expect(result).toBe("hello…");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});
