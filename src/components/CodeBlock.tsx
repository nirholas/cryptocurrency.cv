"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  title?: string;
  collapsible?: boolean;
  maxHeight?: number;
  wrapLines?: boolean;
}

/* ─── Syntax Highlighting Engine ─── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LANG_RULES: Record<
  string,
  { pattern: RegExp; className: string }[]
> = {
  bash: [
    { pattern: /(#[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: "text-green-400" },
    { pattern: /('(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /^(curl|pip|npm|pnpm|bun|go|composer|npx|bunx|wget|docker|git|brew|apt|yarn)\b/gm, className: "text-cyan-400 font-semibold" },
    { pattern: /(\s)(--?\w[\w-]*)/g, className: "text-yellow-400" },
    { pattern: /(\||\&\&|\|\||;|>|>>|<)/g, className: "text-red-400" },
    { pattern: /(\$\w+|\$\{[^}]+\})/g, className: "text-orange-400" },
  ],
  python: [
    { pattern: /(#[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, className: "text-green-400" },
    { pattern: /(f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /\b(import|from|def|class|return|if|else|elif|for|while|in|as|with|try|except|raise|print|True|False|None|and|or|not|is|lambda|yield|async|await|pass|break|continue)\b/g, className: "text-purple-400" },
    { pattern: /\b(self|cls)\b/g, className: "text-red-400" },
    { pattern: /\b(int|str|float|bool|list|dict|tuple|set|bytes|type)\b/g, className: "text-cyan-400" },
    { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
    { pattern: /(@\w+)/g, className: "text-yellow-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
  ],
  javascript: [
    { pattern: /(\/\/[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, className: "text-gray-500 italic" },
    { pattern: /(`(?:[^`\\]|\\.)*`)/g, className: "text-green-400" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /\b(const|let|var|function|async|await|return|import|from|export|default|if|else|for|while|class|new|try|catch|throw|typeof|instanceof|switch|case|break|continue|of|in|yield|delete|void|this|super)\b/g, className: "text-purple-400" },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: "text-orange-400" },
    { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
    { pattern: /(=&gt;|=>)/g, className: "text-purple-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
    { pattern: /\b(console|document|window|process|require|module|exports|Promise|Array|Object|String|Number|Boolean|Map|Set|JSON|Math|Date|Error|RegExp)\b/g, className: "text-cyan-400" },
  ],
  typescript: [], // Will fall through to javascript
  go: [
    { pattern: /(\/\/[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: "text-green-400" },
    { pattern: /(`[^`]*`)/g, className: "text-green-400" },
    { pattern: /\b(package|import|func|var|const|type|struct|interface|return|if|else|for|range|defer|go|chan|select|case|switch|break|continue|nil|map|make|append|len|cap|new|delete|close|copy|panic|recover|fallthrough|goto)\b/g, className: "text-purple-400" },
    { pattern: /\b(true|false|iota)\b/g, className: "text-orange-400" },
    { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
    { pattern: /\b(fmt|http|json|io|log|os|strings|strconv|context|sync|time|net|bytes|bufio|errors|sort|math|regexp|encoding)\b/g, className: "text-cyan-400" },
    { pattern: /\b(string|int|int64|float64|bool|byte|rune|error|any|interface\{\})\b/g, className: "text-cyan-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
  ],
  php: [
    { pattern: /(\/\/[^\n]*|#[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, className: "text-gray-500 italic" },
    { pattern: /(&lt;\?php|\?&gt;)/g, className: "text-red-400 font-semibold" },
    { pattern: /(\$\w+)/g, className: "text-orange-400" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /\b(use|function|return|echo|if|else|foreach|while|class|new|require|include|namespace|public|private|protected|static|abstract|final|extends|implements|try|catch|throw|array|null|true|false)\b/g, className: "text-purple-400" },
    { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
  ],
  json: [
    { pattern: /("(?:[^"\\]|\\.)*")(\s*:)/g, className: "text-cyan-400" },
    { pattern: /(:\s*)("(?:[^"\\]|\\.)*")/g, className: "text-green-400" },
    { pattern: /\b(true|false|null)\b/g, className: "text-purple-400" },
    { pattern: /\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, className: "text-orange-400" },
  ],
  xml: [
    { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, className: "text-gray-500 italic" },
    { pattern: /(&lt;\/?)([\w:-]+)/g, className: "text-red-400" },
    { pattern: /\b([\w:-]+)(=)/g, className: "text-yellow-400" },
    { pattern: /("(?:[^"]*)")/g, className: "text-green-400" },
    { pattern: /(&lt;[!?/]?|\/?\s*&gt;)/g, className: "text-gray-500" },
  ],
  ruby: [
    { pattern: /(#[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: "text-green-400" },
    { pattern: /\b(require|def|end|class|module|if|else|elsif|unless|while|until|do|return|yield|block|self|nil|true|false|rescue|ensure|raise|begin|puts|print|attr_accessor|attr_reader|attr_writer|include|extend)\b/g, className: "text-purple-400" },
    { pattern: /(:\w+)/g, className: "text-cyan-400" },
    { pattern: /(@\w+)/g, className: "text-orange-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
  ],
  rust: [
    { pattern: /(\/\/[^\n]*)/g, className: "text-gray-500 italic" },
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: "text-green-400" },
    { pattern: /\b(fn|let|mut|const|struct|enum|impl|trait|pub|use|mod|self|super|crate|return|if|else|match|for|while|loop|break|continue|async|await|move|ref|where|type|as|in|unsafe|extern|dyn|static)\b/g, className: "text-purple-400" },
    { pattern: /\b(true|false|None|Some|Ok|Err)\b/g, className: "text-orange-400" },
    { pattern: /\b(i32|i64|u32|u64|f32|f64|bool|str|String|Vec|Option|Result|Box|Rc|Arc|usize|isize)\b/g, className: "text-cyan-400" },
    { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
    { pattern: /\b(\w+)!/g, className: "text-yellow-400" },
    { pattern: /\b(\w+)\s*\(/g, className: "text-blue-400" },
  ],
};

// Alias map
LANG_RULES.ts = LANG_RULES.javascript;
LANG_RULES.js = LANG_RULES.javascript;
LANG_RULES.shell = LANG_RULES.bash;
LANG_RULES.zsh = LANG_RULES.bash;
LANG_RULES.sh = LANG_RULES.bash;
LANG_RULES.typescript = LANG_RULES.javascript;
LANG_RULES.jsx = LANG_RULES.javascript;
LANG_RULES.tsx = LANG_RULES.javascript;
LANG_RULES.html = LANG_RULES.xml;
LANG_RULES.svg = LANG_RULES.xml;
LANG_RULES.rs = LANG_RULES.rust;
LANG_RULES.rb = LANG_RULES.ruby;
LANG_RULES.py = LANG_RULES.python;

function highlightSyntax(code: string, language: string): string {
  const escaped = escapeHtml(code);
  const rules = LANG_RULES[language];
  if (!rules || rules.length === 0) return escaped;

  // Use a token-based approach: find all matches, sort by position, apply non-overlapping
  interface Token { start: number; end: number; className: string; text: string }
  const tokens: Token[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    while ((match = regex.exec(escaped)) !== null) {
      // Use last capturing group for the highlight, or whole match
      const group = match[1] || match[0];
      const start = match.index + match[0].indexOf(group);
      tokens.push({
        start,
        end: start + group.length,
        className: rule.className,
        text: group,
      });
    }
  }

  // Sort by start position, longer matches first for ties
  tokens.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping tokens (keep first/longest)
  const filtered: Token[] = [];
  let lastEnd = 0;
  for (const t of tokens) {
    if (t.start >= lastEnd) {
      filtered.push(t);
      lastEnd = t.end;
    }
  }

  // Build highlighted string
  let result = "";
  let pos = 0;
  for (const t of filtered) {
    if (t.start > pos) result += escaped.slice(pos, t.start);
    result += `<span class="${t.className}">${t.text}</span>`;
    pos = t.end;
  }
  if (pos < escaped.length) result += escaped.slice(pos);

  return result;
}

/* ─── Icons ─── */

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WrapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("transition-transform", collapsed ? "rotate-0" : "rotate-90")}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ─── Language display names ─── */

const LANG_LABELS: Record<string, string> = {
  bash: "Shell",
  shell: "Shell",
  sh: "Shell",
  zsh: "Shell",
  python: "Python",
  py: "Python",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  go: "Go",
  php: "PHP",
  json: "JSON",
  xml: "XML",
  html: "HTML",
  ruby: "Ruby",
  rb: "Ruby",
  rust: "Rust",
  rs: "Rust",
  svg: "SVG",
};

/* ─── File extension map ─── */

const LANG_EXT: Record<string, string> = {
  bash: "sh",
  shell: "sh",
  python: "py",
  javascript: "js",
  typescript: "ts",
  go: "go",
  php: "php",
  json: "json",
  xml: "xml",
  html: "html",
  ruby: "rb",
  rust: "rs",
};

/* ─── Component ─── */

export default function CodeBlock({
  code,
  language = "bash",
  className,
  showLineNumbers = false,
  highlightLines = [],
  title,
  collapsible = false,
  maxHeight,
  wrapLines: initialWrap = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsible);
  const [wrapLines, setWrapLines] = useState(initialWrap);

  const lines = useMemo(() => code.split("\n"), [code]);
  const highlightSet = useMemo(() => new Set(highlightLines), [highlightLines]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const ext = LANG_EXT[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  const displayLabel = title || LANG_LABELS[language] || language.toUpperCase();
  const shouldShowLineNumbers = showLineNumbers || lines.length > 5;

  return (
    <div
      className={cn(
        "group relative rounded-lg bg-[#0d1117] border border-[#30363d] overflow-hidden text-[13px]",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              aria-label={collapsed ? "Expand code" : "Collapse code"}
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          )}
          <span className="text-xs font-mono text-gray-500">
            {displayLabel}
          </span>
          {lines.length > 1 && (
            <span className="text-[10px] text-gray-600">
              {lines.length} lines
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Wrap toggle */}
          {lines.some((l) => l.length > 80) && (
            <button
              onClick={() => setWrapLines(!wrapLines)}
              className={cn(
                "rounded-md p-1.5 text-xs transition-colors cursor-pointer",
                wrapLines
                  ? "text-blue-400 bg-blue-400/10"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#30363d]"
              )}
              aria-label={wrapLines ? "Disable word wrap" : "Enable word wrap"}
              title={wrapLines ? "Disable word wrap" : "Enable word wrap"}
            >
              <WrapIcon />
            </button>
          )}
          {/* Download */}
          {lines.length > 3 && (
            <button
              onClick={handleDownload}
              className="rounded-md p-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#30363d] transition-colors cursor-pointer"
              aria-label="Download snippet"
              title="Download snippet"
            >
              <DownloadIcon />
            </button>
          )}
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#30363d] transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <CheckIcon />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      {!collapsed && (
        <div
          className={cn(maxHeight && "overflow-y-auto")}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <pre
            className={cn(
              "p-4 leading-relaxed",
              wrapLines ? "whitespace-pre-wrap break-all" : "overflow-x-auto"
            )}
          >
            <code className="font-mono text-gray-300">
              {shouldShowLineNumbers
                ? lines.map((line, i) => {
                    const lineNum = i + 1;
                    const isHighlighted = highlightSet.has(lineNum);
                    return (
                      <span
                        key={i}
                        className={cn(
                          "table-row",
                          isHighlighted && "bg-yellow-500/10"
                        )}
                      >
                        <span
                          className={cn(
                            "table-cell pr-4 text-right select-none w-[3ch] min-w-[3ch]",
                            isHighlighted
                              ? "text-yellow-500/80 border-l-2 border-yellow-500 pl-2"
                              : "text-gray-600"
                          )}
                        >
                          {lineNum}
                        </span>
                        <span
                          className="table-cell pl-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightSyntax(line, language),
                          }}
                        />
                        {"\n"}
                      </span>
                    );
                  })
                : lines.map((line, i) => (
                    <span key={i}>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightSyntax(line, language),
                        }}
                      />
                      {i < lines.length - 1 ? "\n" : ""}
                    </span>
                  ))}
            </code>
          </pre>
        </div>
      )}

      {/* Collapsed indicator */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#161b22] transition-colors text-left cursor-pointer"
        >
          Click to expand ({lines.length} lines)
        </button>
      )}
    </div>
  );
}
