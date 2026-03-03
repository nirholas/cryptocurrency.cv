#!/usr/bin/env node
/**
 * Fix Disabled Feeds
 *
 * Re-checks all disabled RSS feed sources and:
 * - Re-enables feeds that now respond OK (removes `disabled: true` line)
 * - Removes feeds that are still broken (removes the entire source block)
 *
 * Usage:
 *   node scripts/fix-disabled-feeds.js           # dry-run (preview changes)
 *   node scripts/fix-disabled-feeds.js --apply    # apply changes to file
 */

const fs = require("fs");
const path = require("path");

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 15;
const APPLY = process.argv.includes("--apply");

const FILE_PATH = path.resolve(__dirname, "../src/lib/crypto-news.ts");

/**
 * Check a single URL, returning status code or error string.
 */
async function checkUrl(url) {
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
 * Parse the file and find all disabled source blocks with their exact positions.
 * Returns array of { key, name, url, category, start, end, disabledLineIdx, blockText }
 */
function parseDisabledBlocks(src) {
  const lines = src.split("\n");
  const blocks = [];

  // Find all source key entries in RSS_SOURCES
  // Pattern: key: {
  //   name: "...",
  //   url: "...",
  //   category: "...",
  //   disabled: true, // reason
  // },
  for (let i = 0; i < lines.length; i++) {
    const keyMatch = lines[i].match(/^\s+(\w+):\s*\{/);
    if (!keyMatch) continue;

    // Find the closing brace
    let end = i;
    let braceDepth = 0;
    let foundOpen = false;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes("{")) {
        braceDepth += (lines[j].match(/\{/g) || []).length;
        foundOpen = true;
      }
      if (lines[j].includes("}")) {
        braceDepth -= (lines[j].match(/\}/g) || []).length;
      }
      if (foundOpen && braceDepth <= 0) {
        end = j;
        break;
      }
    }

    // Check if this block has disabled: true
    const blockLines = lines.slice(i, end + 1);
    const blockText = blockLines.join("\n");
    const hasDisabled = blockText.match(/disabled:\s*true/);
    if (!hasDisabled) continue;

    const nameMatch = blockText.match(/name:\s*"([^"]+)"/);
    const urlMatch = blockText.match(/url:\s*"([^"]+)"/);
    const categoryMatch = blockText.match(/category:\s*"([^"]+)"/);

    if (!nameMatch || !urlMatch) continue;

    // Find the exact line index of the disabled property
    let disabledLineIdx = -1;
    for (let j = i; j <= end; j++) {
      if (lines[j].match(/\s+disabled:\s*true/)) {
        disabledLineIdx = j;
        break;
      }
    }

    blocks.push({
      key: keyMatch[1],
      name: nameMatch[1],
      url: urlMatch[1],
      category: categoryMatch ? categoryMatch[1] : "unknown",
      start: i,
      end: end,
      disabledLineIdx,
      blockText,
    });
  }

  return blocks;
}

async function main() {
  console.log(APPLY ? "🔧 APPLY MODE — changes will be written to file\n" : "👀 DRY-RUN MODE — use --apply to write changes\n");

  const src = fs.readFileSync(FILE_PATH, "utf-8");
  const blocks = parseDisabledBlocks(src);

  console.log(`Found ${blocks.length} disabled source blocks. Checking URLs...\n`);

  // Check all URLs
  const results = [];
  for (let i = 0; i < blocks.length; i += CONCURRENCY) {
    const batch = blocks.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (block) => {
        const result = await checkUrl(block.url);
        return { ...block, ...result };
      })
    );
    results.push(...batchResults);
    process.stderr.write(`\r  Checked ${results.length}/${blocks.length}...`);
  }
  process.stderr.write("\n\n");

  const recovered = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);

  console.log(`✅ ${recovered.length} feeds recovered (will re-enable)`);
  console.log(`❌ ${broken.length} feeds still broken (will remove)\n`);

  if (recovered.length > 0) {
    console.log("Re-enabling:");
    for (const r of recovered) {
      console.log(`  ✅ ${r.name} (${r.status})`);
    }
    console.log();
  }

  if (broken.length > 0) {
    console.log("Removing:");
    for (const r of broken) {
      const statusStr = r.error || String(r.status);
      console.log(`  ❌ ${r.name} (${statusStr})`);
    }
    console.log();
  }

  if (!APPLY) {
    console.log("Run with --apply to write changes.");
    return;
  }

  // Apply changes
  const lines = src.split("\n");

  // Build set of lines to remove and lines to modify
  const linesToRemove = new Set();
  const linesToModify = new Map(); // lineIdx -> newContent

  // For recovered feeds: remove just the disabled line
  for (const r of recovered) {
    if (r.disabledLineIdx >= 0) {
      linesToRemove.add(r.disabledLineIdx);
    }
  }

  // For broken feeds: remove entire block + trailing comma/blank lines
  for (const r of broken) {
    // Check if there's a trailing comma on the closing brace line
    for (let j = r.start; j <= r.end; j++) {
      linesToRemove.add(j);
    }
    // Also remove a blank line after the block if present
    if (r.end + 1 < lines.length && lines[r.end + 1].trim() === "") {
      linesToRemove.add(r.end + 1);
    }
  }

  // Build new file content
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (linesToRemove.has(i)) continue;
    if (linesToModify.has(i)) {
      newLines.push(linesToModify.get(i));
    } else {
      newLines.push(lines[i]);
    }
  }

  // Clean up multiple consecutive blank lines
  const cleaned = [];
  let prevBlank = false;
  for (const line of newLines) {
    const isBlank = line.trim() === "";
    if (isBlank && prevBlank) continue;
    cleaned.push(line);
    prevBlank = isBlank;
  }

  fs.writeFileSync(FILE_PATH, cleaned.join("\n"), "utf-8");

  // Count changes
  const originalLines = src.split("\n").length;
  const newLineCount = cleaned.length;
  console.log(`\n✅ Done! File updated.`);
  console.log(`   Lines: ${originalLines} → ${newLineCount} (removed ${originalLines - newLineCount})`);
  console.log(`   Re-enabled: ${recovered.length} feeds`);
  console.log(`   Removed: ${broken.length} feeds`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
