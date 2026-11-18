#!/usr/bin/env node
/**
 * Check Disabled Feed URLs
 *
 * Re-checks all disabled RSS feed sources to see if any have come back online.
 * Reports current HTTP status for each disabled feed URL.
 *
 * Usage:
 *   node scripts/check-disabled-feeds.js
 *   node scripts/check-disabled-feeds.js --json     # JSON output
 *   node scripts/check-disabled-feeds.js --only-ok   # Only show recovered feeds
 */

const fs = require("fs");
const path = require("path");

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 15;
const JSON_OUTPUT = process.argv.includes("--json");
const ONLY_OK = process.argv.includes("--only-ok");

/**
 * Parse RSS_SOURCES from crypto-news.ts to extract disabled entries.
 * Uses simple regex parsing — no TS compilation needed.
 */
function parseDisabledSources(filePath) {
  const src = fs.readFileSync(filePath, "utf-8");

  // Match each source block: key: { name, url, category, disabled, comment }
  const blockRe =
    /(\w+):\s*\{[^}]*?name:\s*"([^"]+)"[^}]*?url:\s*"([^"]+)"[^}]*?category:\s*"([^"]+)"[^}]*?disabled:\s*true[^}]*?\}/gs;

  const sources = [];
  let match;
  while ((match = blockRe.exec(src)) !== null) {
    const [block, key, name, url, category] = match;
    // Extract the disable reason from the comment
    const reasonMatch = block.match(/disabled:\s*true,?\s*\/\/\s*(.+)/);
    const reason = reasonMatch ? reasonMatch[1].trim() : "unknown";
    sources.push({ key, name, url, category, reason });
  }
  return sources;
}

/**
 * Allow only http(s) URLs whose host is not loopback, private or link-local.
 */
function isPublicHttpUrl(value) {
  let u;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) {
      return false;
    }
  }
  if (host.includes(":")) {
    if (host === "::1" || host === "::" || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || host.startsWith("::ffff:")) {
      return false;
    }
  }
  return true;
}

/**
 * Check a single URL, returning status code or error string.
 */
async function checkUrl(url) {
  if (!isPublicHttpUrl(url)) {
    return { status: null, ok: false, error: "BLOCKED_URL" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; free-crypto-news feed checker/1.0)",
      },
    });
    clearTimeout(timer);
    return { status: res.status, ok: res.ok, error: null };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === "AbortError" ? "TIMEOUT" : err.code || err.message;
    return { status: null, ok: false, error: msg };
  }
}

/**
 * Run checks with limited concurrency.
 */
async function checkAll(sources) {
  const results = [];
  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (src) => {
        const result = await checkUrl(src.url);
        return { ...src, ...result };
      }),
    );
    results.push(...batchResults);
    if (!JSON_OUTPUT) {
      process.stderr.write(
        `\r  Checked ${results.length}/${sources.length} feeds...`,
      );
    }
  }
  if (!JSON_OUTPUT) process.stderr.write("\n");
  return results;
}

function statusEmoji(r) {
  if (r.ok) return "✅";
  if (r.error) return "💀";
  if (r.status >= 500) return "🔥";
  if (r.status === 403) return "🔒";
  if (r.status === 404) return "❌";
  return "⚠️";
}

async function main() {
  const filePath = path.resolve(__dirname, "../src/lib/crypto-news.ts");

  if (!JSON_OUTPUT) {
    console.log("🔍 Parsing disabled feed sources from crypto-news.ts...\n");
  }

  const sources = parseDisabledSources(filePath);

  if (!JSON_OUTPUT) {
    console.log(`  Found ${sources.length} disabled sources. Checking...\n`);
  }

  const results = await checkAll(sources);

  // Separate recovered vs. still-broken
  const recovered = results.filter((r) => r.ok);
  const stillBroken = results.filter((r) => !r.ok);

  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        { recovered, stillBroken, total: results.length },
        null,
        2,
      ),
    );
    return;
  }

  if (recovered.length > 0) {
    console.log(
      `\n✅ RECOVERED (${recovered.length} feeds now responding OK):\n`,
    );
    console.log(
      "  " +
        ["Name", "Status", "Category", "URL"].map((h) => h.padEnd(30)).join(""),
    );
    console.log("  " + "─".repeat(110));
    for (const r of recovered) {
      console.log(
        "  " +
          [r.name, `${r.status}`, r.category, r.url]
            .map((v, i) => v.padEnd(i === 2 ? 15 : 30))
            .join(""),
      );
    }
  }

  if (!ONLY_OK) {
    console.log(`\n❌ STILL BROKEN (${stillBroken.length} feeds):\n`);
    console.log(
      "  " +
        ["Name", "Status", "Reason", "URL"].map((h) => h.padEnd(30)).join(""),
    );
    console.log("  " + "─".repeat(120));
    for (const r of stillBroken) {
      const statusStr = r.error || String(r.status);
      console.log(
        "  " +
          `${statusEmoji(r)} ` +
          [r.name, statusStr, r.reason.slice(0, 28), r.url]
            .map((v, i) => v.padEnd(30))
            .join(""),
      );
    }
  }

  console.log(
    `\n📊 Summary: ${recovered.length} recovered, ${stillBroken.length} still broken, ${results.length} total disabled\n`,
  );

  if (recovered.length > 0) {
    console.log(
      "💡 To re-enable recovered feeds, remove `disabled: true` from these entries in src/lib/crypto-news.ts:\n",
    );
    for (const r of recovered) {
      console.log(`   - ${r.key} (${r.name})`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
