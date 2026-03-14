#!/usr/bin/env bash
set -euo pipefail

# Safe Database Migration Script
# Usage: ./scripts/db/safe-migrate.sh [--dry-run] [--production]

DRY_RUN=false
PRODUCTION=false

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --production) PRODUCTION=true ;;
  esac
done

echo "╔══════════════════════════════════════╗"
echo "║   Database Migration — Safety Check  ║"
echo "╚══════════════════════════════════════╝"

# 1. Verify DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# 2. Show which database we're targeting (extract host safely)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
echo "🎯 Target: $DB_HOST"

# 3. Production confirmation
if [ "$PRODUCTION" = true ]; then
  echo "⚠️  PRODUCTION migration requested"
  read -p "Type 'yes-migrate' to confirm: " CONFIRM
  if [ "$CONFIRM" != "yes-migrate" ]; then
    echo "❌ Aborted"
    exit 1
  fi
fi

# 4. Generate migration if schema changed
echo "📝 Generating migration from schema diff..."
bunx drizzle-kit generate 2>&1 | tee /tmp/drizzle-generate.log

# 5. Show pending migrations
echo ""
echo "📋 Pending migrations:"
ls -la src/lib/db/migrations/*.sql 2>/dev/null || echo "   (none)"

# 6. Dry run — show SQL without executing
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "🔍 DRY RUN — SQL that would be executed:"
  for f in src/lib/db/migrations/*.sql; do
    if [ -f "$f" ]; then
      echo ""
      echo "── $(basename "$f") ──"
      cat "$f"
    fi
  done
  echo ""
  echo "✅ Dry run complete. No changes applied."
  exit 0
fi

# 7. Create backup point (Neon supports branching)
echo ""
echo "💾 Recommendation: Create a Neon branch backup before proceeding"
echo "   neon branches create --name pre-migration-$(date +%Y%m%d%H%M%S)"

# 8. Apply migration
echo ""
echo "🚀 Applying migration..."
bunx drizzle-kit migrate 2>&1 | tee /tmp/drizzle-migrate.log

echo ""
echo "✅ Migration complete"
