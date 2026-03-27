/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "@/i18n/navigation";
import { Keyboard, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsContextType {
  showHelp: () => void;
  /** Currently pending key (for multi-key sequences) */
  pendingKey: string | null;
  /** Recently executed shortcut label */
  lastAction: string | null;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  showHelp: () => {},
  pendingKey: null,
  lastAction: null,
});

export function useKeyboardShortcuts() {
  return useContext(KeyboardShortcutsContext);
}

/* ───────── Shortcut definitions ───────── */

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const modKey = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: Shortcut[] = [
  // General
  { keys: [modKey, "K"], description: "Open search", category: "General" },
  { keys: ["/"], description: "Focus search", category: "General" },
  { keys: ["Esc"], description: "Close modal / menu", category: "General" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: [modKey, "\\"], description: "Toggle sidebar / drawer", category: "General" },
  // Navigation
  { keys: ["g", "h"], description: "Go to Home", category: "Navigation" },
  { keys: ["g", "m"], description: "Go to Markets", category: "Navigation" },
  { keys: ["g", "d"], description: "Go to DeFi", category: "Navigation" },
  { keys: ["g", "s"], description: "Go to Sources", category: "Navigation" },
  { keys: ["g", "a"], description: "Go to Alerts", category: "Navigation" },
  { keys: ["g", "b"], description: "Go to Bookmarks", category: "Navigation" },
  { keys: ["g", "p"], description: "Go to Portfolio", category: "Navigation" },
  { keys: ["g", "c"], description: "Go to Calculator", category: "Navigation" },
  { keys: ["g", "l"], description: "Go to Learn", category: "Navigation" },
  // Actions
  { keys: ["j"], description: "Next item / scroll down", category: "Actions" },
  { keys: ["k"], description: "Previous item / scroll up", category: "Actions" },
  { keys: ["r"], description: "Refresh page", category: "Actions" },
  { keys: ["t"], description: "Toggle theme", category: "Actions" },
];

/* ───────── Helpers ───────── */

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  // Also check Radix dialog content
  if (el.closest("[role='dialog']")) return true;
  return false;
}

/* ───────── Provider ───────── */

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingKeyState, setPendingKeyState] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHelp = useCallback(() => setHelpOpen(true), []);

  const flashAction = useCallback((label: string) => {
    setLastAction(label);
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = setTimeout(() => setLastAction(null), 1500);
  }, []);

  /* Handle key sequences */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      /* ── Cmd+K / Ctrl+K → let Header handle ── */
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        return;
      }

      /* ── Cmd+\ / Ctrl+\ → toggle sidebar / mobile menu ── */
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("fcn:toggle-sidebar"));
        flashAction("Toggle sidebar");
        return;
      }

      /* ── Escape → close ── */
      if (e.key === "Escape") {
        document.dispatchEvent(new CustomEvent("fcn:close-menus"));
        return;
      }

      /* Don't capture when typing in inputs */
      if (isInputFocused()) return;

      /* ── / → Focus search ── */
      if (e.key === "/") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("fcn:open-search"));
        flashAction("Open search");
        return;
      }

      /* ── ? → Show shortcuts help ── */
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        setSearchFilter("");
        return;
      }

      /* ── j / k → scroll ── */
      if (e.key === "j" && !pendingKey.current) {
        window.scrollBy({ top: 200, behavior: "smooth" });
        return;
      }
      if (e.key === "k" && !pendingKey.current) {
        window.scrollBy({ top: -200, behavior: "smooth" });
        return;
      }

      /* ── r → refresh ── */
      if (e.key === "r" && !pendingKey.current) {
        e.preventDefault();
        router.refresh();
        flashAction("Page refreshed");
        return;
      }

      /* ── t → toggle theme ── */
      if (e.key === "t" && !pendingKey.current) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("fcn:toggle-theme"));
        flashAction("Theme toggled");
        return;
      }

      /* ── g + key sequences ── */
      if (pendingKey.current === "g") {
        pendingKey.current = null;
        setPendingKeyState(null);
        if (pendingTimer.current) clearTimeout(pendingTimer.current);

        const routes: Record<string, { path: string; label: string }> = {
          h: { path: "/", label: "Home" },
          m: { path: "/markets", label: "Markets" },
          d: { path: "/defi", label: "DeFi" },
          s: { path: "/sources", label: "Sources" },
          a: { path: "/alerts", label: "Alerts" },
          b: { path: "/bookmarks", label: "Bookmarks" },
          p: { path: "/portfolio", label: "Portfolio" },
          c: { path: "/calculator", label: "Calculator" },
          l: { path: "/learn", label: "Learn" },
        };

        const route = routes[e.key];
        if (route) {
          e.preventDefault();
          router.push(route.path);
          flashAction(`→ ${route.label}`);
        }
        return;
      }

      if (e.key === "g") {
        pendingKey.current = "g";
        setPendingKeyState("g");
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        pendingTimer.current = setTimeout(() => {
          pendingKey.current = null;
          setPendingKeyState(null);
        }, 1000);
        return;
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router, flashAction]);

  /* Listen for theme toggle (Header can handle this) */
  useEffect(() => {
    const handler = () => {
      // Dispatch to theme providers — Header already has toggleTheme
      const themeToggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
      themeToggle?.click();
    };
    document.addEventListener("fcn:toggle-theme", handler);
    return () => document.removeEventListener("fcn:toggle-theme", handler);
  }, []);

  /* Group & filter shortcuts */
  const grouped = SHORTCUTS.reduce<Record<string, Shortcut[]>>((acc, s) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      if (!s.description.toLowerCase().includes(q) && !s.keys.join(" ").toLowerCase().includes(q)) {
        return acc;
      }
    }
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const totalShown = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);

  return (
    <KeyboardShortcutsContext value={{ showHelp, pendingKey: pendingKeyState, lastAction }}>
      {children}

      {/* Pending key indicator (bottom-left) */}
      {pendingKeyState && (
        <div className="fixed bottom-4 left-4 z-[110] flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) shadow-lg px-3 py-2 animate-in fade-in-0 zoom-in-95">
          <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded border border-accent/30 bg-accent/10 px-2 font-mono text-sm font-semibold text-accent">
            {pendingKeyState}
          </kbd>
          <ArrowRight className="h-3 w-3 text-text-tertiary" />
          <span className="text-xs text-text-secondary">waiting for next key…</span>
        </div>
      )}

      {/* Action flash indicator (bottom-center) */}
      {lastAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] rounded-lg border border-border bg-(--color-surface) shadow-lg px-4 py-2 animate-in fade-in-0 slide-in-from-bottom-2">
          <span className="text-sm font-medium text-text-primary">{lastAction}</span>
        </div>
      )}

      {/* Shortcuts Help Modal */}
      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border border-border bg-(--color-surface) shadow-2xl",
              "flex flex-col max-h-[80vh] focus:outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <Dialog.Title className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-accent" />
                Keyboard Shortcuts
              </Dialog.Title>
              <Dialog.Close className="rounded-md p-1.5 text-text-secondary hover:bg-border transition-colors">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="px-6 pt-4">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter shortcuts…"
                autoFocus
                className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Scrollable shortcuts list */}
            <div className="overflow-y-auto p-6 space-y-6">
              {totalShown === 0 ? (
                <p className="text-center text-sm text-text-tertiary py-4">
                  No shortcuts match &ldquo;{searchFilter}&rdquo;
                </p>
              ) : (
                Object.entries(grouped).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                      {category}
                    </h3>
                    <ul className="space-y-1">
                      {shortcuts.map((s) => (
                        <li
                          key={s.description}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-border/30 transition-colors"
                        >
                          <span className="text-text-secondary">
                            {s.description}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 ml-4">
                            {s.keys.map((k, i) => (
                              <span key={i} className="inline-flex items-center gap-0.5">
                                {i > 0 && (
                                  <span className="text-text-tertiary mx-0.5 text-[10px]">
                                    then
                                  </span>
                                )}
                                <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-(--color-surface) px-1.5 font-mono text-xs text-text-primary shadow-sm">
                                  {k}
                                </kbd>
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-text-tertiary">
                {SHORTCUTS.length} shortcuts available
              </p>
              <p className="text-xs text-text-tertiary">
                Press <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">?</kbd> to toggle
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </KeyboardShortcutsContext>
  );
}

