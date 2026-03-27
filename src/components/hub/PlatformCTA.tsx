/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useCallback } from "react";
import {
  Code2,
  Puzzle,
  Terminal,
  Globe,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RouteStats {
  total: number;
  categories: number;
}

/* ------------------------------------------------------------------ */
/*  PlatformCTA                                                        */
/* ------------------------------------------------------------------ */

export default function PlatformCTA() {
  const [stats, setStats] = useState<RouteStats>({ total: 477, categories: 30 });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "python">("curl");

  // Route stats are hardcoded — no dynamic fetch needed
  void stats;

  const codeExamples = {
    curl: `curl https://cryptocurrency.cv/api/news?limit=5`,
    js: `const res = await fetch("https://cryptocurrency.cv/api/news?limit=5");
const { articles } = await res.json();`,
    python: `import requests
data = requests.get("https://cryptocurrency.cv/api/news?limit=5").json()`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrations = [
    { icon: Cpu, label: "Claude MCP", href: "/docs/integrations/mcp" },
    { icon: Puzzle, label: "ChatGPT Plugin", href: "/docs/integrations/chatgpt" },
    { icon: Terminal, label: "CLI Tool", href: "/docs/cli" },
    { icon: Globe, label: "Browser Extension", href: "/docs/extension" },
  ];

  return (
    <section className="border-border border-b">
      <div className="container-main py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — text + stats */}
          <div>
            <div className="bg-accent/10 text-accent mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Code2 className="h-3 w-3" />
              Developer Platform
            </div>
            <h2 className="text-text-primary mb-3 font-serif text-2xl font-bold lg:text-3xl">
              {stats.total} endpoints.
              <br />
              Zero API keys.
            </h2>
            <p className="text-text-secondary mb-8 max-w-md text-sm leading-relaxed">
              Free REST API, RSS feeds, WebSocket streams, and GraphQL. Works with ChatGPT,
              Claude, Copilot, and any HTTP client. SDKs for TypeScript, Python, Go, React, and
              PHP.
            </p>

            {/* Quick stats */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div>
                <div className="text-text-primary text-2xl font-bold">{stats.total}+</div>
                <div className="text-text-tertiary text-xs">API Endpoints</div>
              </div>
              <div>
                <div className="text-text-primary text-2xl font-bold">300+</div>
                <div className="text-text-tertiary text-xs">News Sources</div>
              </div>
              <div>
                <div className="text-text-primary text-2xl font-bold">$0</div>
                <div className="text-text-tertiary text-xs">API Key Required</div>
              </div>
            </div>

            {/* Integration badges */}
            <div className="flex flex-wrap gap-3">
              {integrations.map((int) => (
                <Link
                  key={int.label}
                  href={int.href}
                  className="border-border hover:border-accent text-text-secondary hover:text-accent flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                >
                  <int.icon className="h-3.5 w-3.5" />
                  {int.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — code example */}
          <div>
            <div className="border-border overflow-hidden rounded-xl border">
              {/* Tab bar */}
              <div className="border-border flex items-center justify-between border-b bg-gray-50 px-4 dark:bg-white/5">
                <div className="flex gap-1">
                  {(["curl", "js", "python"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
                        activeTab === tab
                          ? "border-accent text-accent"
                          : "text-text-tertiary hover:text-text-secondary border-transparent",
                      )}
                    >
                      {tab === "curl" ? "cURL" : tab === "js" ? "JavaScript" : "Python"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="text-text-tertiary hover:text-accent flex items-center gap-1 text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Code block */}
              <div className="bg-gray-950 p-5">
                <pre className="font-mono text-sm leading-relaxed text-gray-300">
                  <code>{codeExamples[activeTab]}</code>
                </pre>
              </div>

              {/* Response preview */}
              <div className="border-border border-t bg-gray-50 px-4 py-3 dark:bg-white/5">
                <div className="text-text-tertiary flex items-center gap-2 text-xs">
                  <Braces className="h-3 w-3" />
                  <span>Returns JSON — articles, prices, signals, and more</span>
                </div>
              </div>
            </div>

            {/* CTA links */}
            <div className="mt-4 flex items-center gap-4">
              <Link
                href="/docs"
                className="bg-accent text-text-inverse hover:bg-accent-hover inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                API Docs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/sdks"
                className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
              >
                View SDKs
              </Link>
              <Link
                href="/docs/widgets"
                className="text-text-secondary hover:text-accent text-sm font-medium transition-colors"
              >
                Widgets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
