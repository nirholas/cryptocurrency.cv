#!/usr/bin/env bash
set -euo pipefail

# Retranslate all stale README translations
echo "🔄 Retranslating stale README files..."

# Get list of stale locales from freshness checker
STALE_FILES=$(node -e "
const { execSync } = require('child_process');
const fs = require('fs');
const threshold = parseInt(process.env.STALE_THRESHOLD_DAYS || '30', 10);
const sourceDate = new Date(execSync('git log -1 --format=%aI -- README.md', {encoding:'utf-8'}).trim());
fs.readdirSync('.').filter(f => f.match(/^README\..+\.md$/) && f !== 'README.md').forEach(f => {
  const raw = execSync(\`git log -1 --format=%aI -- \${f}\`, {encoding:'utf-8'}).trim();
  if (!raw) return;
  const d = new Date(raw);
  if ((sourceDate - d) / 86400000 > threshold) console.log(f.match(/README\.(.+)\.md/)[1]);
});
")

if [ -z "$STALE_FILES" ]; then
  echo "✅ No stale translations found"
  exit 0
fi

echo "Stale locales: $STALE_FILES"
echo ""

for LOCALE in $STALE_FILES; do
  echo "  📝 Translating README to $LOCALE..."
  bun run docs:translate -- --file README.md --locales "$LOCALE" || echo "  ⚠️  Failed: $LOCALE"
done

echo ""
echo "✅ Retranslation complete. Review changes with: git diff README.*.md"
