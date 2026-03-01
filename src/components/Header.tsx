"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTheme } from "@/components/ThemeProvider";
import {
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  {
    label: "Markets",
    href: "/markets",
    children: [
      { label: "Overview", href: "/markets" },
      { label: "Fear & Greed", href: "/fear-greed" },
      { label: "Heatmap", href: "/heatmap" },
      { label: "Screener", href: "/screener" },
      { label: "Gas Tracker", href: "/gas" },
    ],
  },
  {
    label: "News",
    href: "/category/bitcoin",
    children: [
      { label: "Bitcoin", href: "/category/bitcoin" },
      { label: "Ethereum", href: "/category/ethereum" },
      { label: "DeFi", href: "/category/defi" },
      { label: "NFTs", href: "/category/nft" },
      { label: "Regulation", href: "/category/regulation" },
      { label: "Altcoins", href: "/category/altcoins" },
    ],
  },
  { label: "DeFi", href: "/defi" },
  { label: "Learn", href: "/learn" },
  {
    label: "Tools",
    href: "/developers",
    children: [
      { label: "API Docs", href: "/developers" },
      { label: "Calculator", href: "/calculator" },
      { label: "Compare", href: "/compare" },
      { label: "Sources", href: "/sources" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
      <div className="container-main flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#f7931a]">F</span>
            <span>CN</span>
          </span>
          <span className="hidden sm:block text-xs font-medium text-[var(--color-text-tertiary)] border-l border-[var(--color-border)] pl-2 ml-1">
            Free Crypto News
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() =>
                "children" in item ? setOpenDropdown(item.label) : undefined
              }
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                )}
              >
                {item.label}
                {"children" in item && (
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                )}
              </Link>

              {/* Dropdown */}
              {"children" in item && openDropdown === item.label && (
                <div className="absolute top-full left-0 pt-1 z-50">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[180px]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <nav className="container-main py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  {item.label}
                </Link>
                {"children" in item && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
