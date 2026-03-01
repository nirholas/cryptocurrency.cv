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
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsContextType {
  showHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  showHelp: () => {},
});

export function useKeyboardShortcuts() {
  return useContext(KeyboardShortcutsContext);
}

/* ───────── Shortcut definitions ───────── */

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open search", category: "General" },
  { keys: ["/"], description: "Focus search", category: "General" },
  { keys: ["Esc"], description: "Close modal / menu", category: "General" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["g", "h"], description: "Go to Home", category: "Navigation" },
  { keys: ["g", "m"], description: "Go to Markets", category: "Navigation" },
  { keys: ["g", "d"], description: "Go to DeFi", category: "Navigation" },
  { keys: ["g", "s"], description: "Go to Sources", category: "Navigation" },
];

/* ───────── Helpers ───────── */

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/* ───────── Provider ───────── */

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHelp = useCallback(() => setHelpOpen(true), []);

  /* Handle key sequences */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      /* ── Cmd+K / Ctrl+K → dispatch search event (Header listens) ── */
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        /* Let the Header's existing handler manage this */
        return;
      }

      /* ── Escape → close (let Radix handle its own dialogs) ── */
      if (e.key === "Escape") {
        /* Radix dialogs already handle Escape; emit for other menus */
        document.dispatchEvent(new CustomEvent("fcn:close-menus"));
        return;
      }

      /* Don't capture when typing in inputs */
      if (isInputFocused()) return;

      /* ── /  → Open / focus search ── */
      if (e.key === "/") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("fcn:open-search"));
        return;
      }

      /* ── ? → Show shortcuts help ── */
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      /* ── g + key sequences ── */
      if (pendingKey.current === "g") {
        pendingKey.current = null;
        if (pendingTimer.current) clearTimeout(pendingTimer.current);

        switch (e.key) {
          case "h":
            e.preventDefault();
            router.push("/");
            return;
          case "m":
            e.preventDefault();
            router.push("/markets");
            return;
          case "d":
            e.preventDefault();
            router.push("/defi");
            return;
          case "s":
            e.preventDefault();
            router.push("/sources");
            return;
        }
        return;
      }

      if (e.key === "g") {
        pendingKey.current = "g";
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        pendingTimer.current = setTimeout(() => {
          pendingKey.current = null;
        }, 800);
        return;
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  /* Group shortcuts by category */
  const grouped = SHORTCUTS.reduce<Record<string, Shortcut[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <KeyboardShortcutsContext value={{ showHelp }}>
      {children}

      {/* Shortcuts Help Modal */}
      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl",
              "p-6 focus:outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-[var(--color-accent)]" />
                Keyboard Shortcuts
              </Dialog.Title>
              <Dialog.Close className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              {Object.entries(grouped).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {shortcuts.map((s) => (
                      <li
                        key={s.description}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[var(--color-text-secondary)]">
                          {s.description}
                        </span>
                        <span className="flex items-center gap-1">
                          {s.keys.map((k, i) => (
                            <span key={i}>
                              {i > 0 && (
                                <span className="text-[var(--color-text-tertiary)] mx-0.5 text-xs">
                                  then
                                </span>
                              )}
                              <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 font-mono text-xs text-[var(--color-text-primary)] shadow-sm">
                                {k}
                              </kbd>
                            </span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-[var(--color-text-tertiary)] text-center">
              Press <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5 font-mono text-[10px]">?</kbd> to toggle this dialog
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </KeyboardShortcutsContext>
  );
}
