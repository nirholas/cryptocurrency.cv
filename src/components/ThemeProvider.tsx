"use client";

import { useEffect, useState } from "react";
import { createContext, useContext } from "react";

type Theme = "light" | "dark" | "midnight" | "system";
type ResolvedTheme = "light" | "dark" | "midnight";

const THEME_CLASSES = ["dark", "midnight"] as const;

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  for (const cls of THEME_CLASSES) {
    root.classList.remove(cls);
  }
  if (resolved === "dark") {
    root.classList.add("dark");
  } else if (resolved === "midnight") {
    root.classList.add("midnight");
  }
}

export function ThemeScript({ nonce }: { nonce?: string }) {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'system';
        var root = document.documentElement;
        root.classList.remove('dark', 'midnight');
        if (theme === 'midnight') {
          root.classList.add('midnight');
        } else {
          var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (dark) root.classList.add('dark');
        }
      } catch(e) { /* localStorage may be unavailable in private browsing */ }
    })();
  `;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = (t: Theme): ResolvedTheme => {
      if (t === "midnight") return "midnight";
      if (t === "system") return mq.matches ? "dark" : "light";
      return t as ResolvedTheme;
    };

    const resolved = resolve(stored);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);

    const handler = () => {
      if (theme === "system") {
        const r = resolve("system");
        setResolvedTheme(r);
        applyThemeClass(r);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    // Add transition class for smooth theme switching
    const root = document.documentElement;
    root.classList.add("theme-transitioning");

    setThemeState(t);
    localStorage.setItem("theme", t);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved: ResolvedTheme =
      t === "midnight" ? "midnight" : t === "system" ? (mq.matches ? "dark" : "light") : (t as ResolvedTheme);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);

    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 350);
  };

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}
