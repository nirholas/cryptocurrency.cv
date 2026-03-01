"use client";

import { useEffect, useState } from "react";
import { createContext, useContext } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
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

export function ThemeScript({ nonce }: { nonce?: string }) {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'system';
        var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
      } catch(e) {}
    })();
  `;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = (t: Theme) => {
      if (t === "system") return mq.matches ? "dark" : "light";
      return t;
    };

    setResolvedTheme(resolve(stored));
    document.documentElement.classList.toggle("dark", resolve(stored) === "dark");

    const handler = () => {
      if (theme === "system") {
        const r = resolve("system");
        setResolvedTheme(r);
        document.documentElement.classList.toggle("dark", r === "dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved = t === "system" ? (mq.matches ? "dark" : "light") : t;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  };

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}
