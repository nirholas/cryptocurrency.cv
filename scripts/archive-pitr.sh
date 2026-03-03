#!/bin/bash

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

#
# Archive Point-in-Time Recovery (PITR)
#
# Restores the archive directory to a specific point in time by:
# 1. Using the latest full backup as a base
# 2. Replaying incremental changes from git history
# 3. Filtering files by modification timestamp
#
# Usage:
#   ./scripts/archive-pitr.sh --timestamp "2025-06-15T12:00:00Z"
#   ./scripts/archive-pitr.sh --date "2025-06-15"
#   ./scripts/archive-pitr.sh --commit abc1234
#   ./scripts/archive-pitr.sh --days-ago 7
#   ./scripts/archive-pitr.sh --list-snapshots
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
ARCHIVE_DIR="$PROJECT_ROOT/archive"
PITR_WORK_DIR=""

# Target
TARGET_TIMESTAMP=""
TARGET_COMMIT=""
LIST_SNAPSHOTS=false
DRY_RUN=false
OUTPUT_DIR=""

# ============================================================================
# Argument Parsing
# ============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --timestamp)    TARGET_TIMESTAMP="$2"; shift 2 ;;
    --date)         TARGET_TIMESTAMP="${2}T23:59:59Z"; shift 2 ;;
    --commit)       TARGET_COMMIT="$2"; shift 2 ;;
    --days-ago)     TARGET_TIMESTAMP=$(date -u -d "$2 days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
                    date -u -v-${2}d +"%Y-%m-%dT%H:%M:%SZ"); shift 2 ;;
    --list-snapshots) LIST_SNAPSHOTS=true; shift ;;
    --output)       OUTPUT_DIR="$2"; shift 2 ;;
    --dry-run)      DRY_RUN=true; shift ;;
    --help|-h)
      echo "Usage: $0 --timestamp <ISO-8601> [--output <dir>] [--dry-run]"
      echo "       $0 --date <YYYY-MM-DD>"
      echo "       $0 --commit <git-sha>"
      echo "       $0 --days-ago <N>"
      echo "       $0 --list-snapshots"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ============================================================================
# Utility Functions
# ============================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()    { echo -e "${CYAN}[STEP]${NC}  $*"; }

cleanup() {
  if [ -n "$PITR_WORK_DIR" ] && [ -d "$PITR_WORK_DIR" ]; then
    rm -rf "$PITR_WORK_DIR"
  fi
}
trap cleanup EXIT

# ============================================================================
# List Snapshots
# ============================================================================

if [ "$LIST_SNAPSHOTS" = true ]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Archive Recovery Points${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""

  echo -e "${CYAN}Local backup snapshots:${NC}"
  for f in $(ls -t "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null | head -20); do
    TS=$(basename "$f" | sed 's/full-backup_//;s/\.tar\.gz//')
    SIZE=$(du -h "$f" | cut -f1)
    echo -e "  ${GREEN}$TS${NC}  ($SIZE)"
  done

  echo ""
  echo -e "${CYAN}Git history recovery points (archive/ commits):${NC}"
  cd "$PROJECT_ROOT"
  git log --oneline --since="90 days ago" -- archive/ 2>/dev/null | head -30 | while read -r line; do
    COMMIT_HASH=$(echo "$line" | cut -d' ' -f1)
    COMMIT_DATE=$(git show -s --format=%ci "$COMMIT_HASH" 2>/dev/null)
    echo -e "  ${GREEN}$COMMIT_HASH${NC}  $COMMIT_DATE  $(echo "$line" | cut -d' ' -f2-)"
  done

  echo ""
  echo -e "${CYAN}Incremental archive snapshots:${NC}"
  if [ -d "$ARCHIVE_DIR/snapshots" ]; then
    ls -t "$ARCHIVE_DIR/snapshots/"*.json 2>/dev/null | head -20 | while read -r f; do
      echo -e "  ${GREEN}$(basename "$f")${NC}"
    done
  else
    echo "  No snapshots directory found"
  fi

  exit 0
fi

# ============================================================================
# Validate Inputs
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Archive Point-in-Time Recovery${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ -z "$TARGET_TIMESTAMP" ] && [ -z "$TARGET_COMMIT" ]; then
  log_error "Must specify --timestamp, --date, --days-ago, or --commit"
  exit 1
fi

# Set default output directory
if [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="$BACKUP_DIR/pitr-recovery"
fi

PITR_WORK_DIR=$(mktemp -d)

if [ -n "$TARGET_TIMESTAMP" ]; then
  log_info "Target recovery point: $TARGET_TIMESTAMP"
fi
if [ -n "$TARGET_COMMIT" ]; then
  log_info "Target commit: $TARGET_COMMIT"
fi

if [ "$DRY_RUN" = true ]; then
  log_warn "DRY RUN mode — no files will be written"
fi
echo ""

# ============================================================================
# Strategy 1: Git-based recovery (preferred)
# ============================================================================

cd "$PROJECT_ROOT"

if [ -n "$TARGET_COMMIT" ]; then
  log_step "Recovering archive at commit $TARGET_COMMIT..."

  if [ "$DRY_RUN" = true ]; then
    log_info "Would checkout archive/ from commit $TARGET_COMMIT"
    FILE_COUNT=$(git ls-tree -r --name-only "$TARGET_COMMIT" -- archive/ 2>/dev/null | wc -l)
    log_info "Files at this commit: $FILE_COUNT"
  else
    mkdir -p "$OUTPUT_DIR"

    # Extract archive directory at the given commit
    git archive "$TARGET_COMMIT" -- archive/ | tar -x -C "$PITR_WORK_DIR" 2>/dev/null

    if [ -d "$PITR_WORK_DIR/archive" ]; then
      cp -r "$PITR_WORK_DIR/archive"/* "$OUTPUT_DIR/" 2>/dev/null || true
      FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
      log_success "Recovered $FILE_COUNT files to $OUTPUT_DIR"
    else
      log_error "No archive directory found at commit $TARGET_COMMIT"
      exit 1
    fi
  fi

elif [ -n "$TARGET_TIMESTAMP" ]; then
  log_step "Finding closest git commit to $TARGET_TIMESTAMP..."

  # Find the last commit before the target timestamp
  CLOSEST_COMMIT=$(git log --until="$TARGET_TIMESTAMP" --format=%H -1 -- archive/ 2>/dev/null || echo "")

  if [ -n "$CLOSEST_COMMIT" ]; then
    COMMIT_DATE=$(git show -s --format=%ci "$CLOSEST_COMMIT" 2>/dev/null)
    log_info "Closest commit: $CLOSEST_COMMIT ($COMMIT_DATE)"

    if [ "$DRY_RUN" = true ]; then
      FILE_COUNT=$(git ls-tree -r --name-only "$CLOSEST_COMMIT" -- archive/ 2>/dev/null | wc -l)
      log_info "Would recover $FILE_COUNT files"
    else
      mkdir -p "$OUTPUT_DIR"

      # Extract archive at that commit
      git archive "$CLOSEST_COMMIT" -- archive/ | tar -x -C "$PITR_WORK_DIR" 2>/dev/null

      if [ -d "$PITR_WORK_DIR/archive" ]; then
        cp -r "$PITR_WORK_DIR/archive"/* "$OUTPUT_DIR/" 2>/dev/null || true
        FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
        log_success "Recovered $FILE_COUNT files from git history"
      else
        log_warn "No archive in git at that point — trying backup-based recovery"
      fi
    fi
  else
    log_warn "No git commits found for archive/ before $TARGET_TIMESTAMP"
    log_info "Falling back to backup-based recovery..."
  fi

  # ========================================================================
  # Strategy 2: Backup-based recovery with timestamp filtering
  # ========================================================================

  if [ ! -d "$OUTPUT_DIR" ] || [ "$(find "$OUTPUT_DIR" -type f 2>/dev/null | wc -l)" -eq 0 ]; then
    log_step "Attempting backup-based recovery..."

    # Find the best backup (closest before the target timestamp)
    TARGET_EPOCH=$(date -d "$TARGET_TIMESTAMP" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$TARGET_TIMESTAMP" +%s 2>/dev/null || echo 0)
    BEST_BACKUP=""
    BEST_DIFF=999999999

    for backup in $(ls -t "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null); do
      BACKUP_TS=$(basename "$backup" | sed 's/full-backup_//;s/\.tar\.gz//')
      # Convert backup timestamp (20250615T120000Z) to epoch
      BACKUP_ISO=$(echo "$BACKUP_TS" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)T\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)Z/\1-\2-\3T\4:\5:\6Z/')
      BACKUP_EPOCH=$(date -d "$BACKUP_ISO" +%s 2>/dev/null || echo 0)

      if [ "$BACKUP_EPOCH" -le "$TARGET_EPOCH" ] 2>/dev/null; then
        DIFF=$((TARGET_EPOCH - BACKUP_EPOCH))
        if [ "$DIFF" -lt "$BEST_DIFF" ]; then
          BEST_DIFF=$DIFF
          BEST_BACKUP="$backup"
        fi
      fi
    done

    if [ -n "$BEST_BACKUP" ]; then
      log_info "Using backup: $(basename "$BEST_BACKUP")"
      
      if [ "$DRY_RUN" = true ]; then
        log_info "Would extract archive from backup and filter by timestamp"
      else
        mkdir -p "$OUTPUT_DIR"

        # Extract the archive component from the backup
        EXTRACT_DIR="$PITR_WORK_DIR/backup-extract"
        mkdir -p "$EXTRACT_DIR"
        tar -xzf "$BEST_BACKUP" -C "$EXTRACT_DIR"

        BACKUP_INNER=$(find "$EXTRACT_DIR" -maxdepth 1 -type d ! -path "$EXTRACT_DIR" | head -1)

        if [ -f "$BACKUP_INNER/archive.tar.gz" ]; then
          tar -xzf "$BACKUP_INNER/archive.tar.gz" -C "$PITR_WORK_DIR"

          if [ -d "$PITR_WORK_DIR/archive" ]; then
            # Filter files by modification time (keep only files modified before target)
            find "$PITR_WORK_DIR/archive" -type f | while read -r f; do
              FILE_MTIME=$(stat -c%Y "$f" 2>/dev/null || echo 0)
              if [ "$FILE_MTIME" -le "$TARGET_EPOCH" ] 2>/dev/null; then
                REL_PATH="${f#$PITR_WORK_DIR/archive/}"
                mkdir -p "$(dirname "$OUTPUT_DIR/$REL_PATH")"
                cp "$f" "$OUTPUT_DIR/$REL_PATH"
              fi
            done

            FILE_COUNT=$(find "$OUTPUT_DIR" -type f 2>/dev/null | wc -l)
            log_success "Recovered $FILE_COUNT files from backup (filtered by timestamp)"
          fi
        else
          log_error "No archive.tar.gz found in backup"
        fi
      fi
    else
      log_error "No suitable backup found for recovery to $TARGET_TIMESTAMP"
      exit 1
    fi
  fi
fi

# ============================================================================
# Generate Recovery Report
# ============================================================================

echo ""
log_step "Generating recovery report..."

if [ "$DRY_RUN" = false ] && [ -d "$OUTPUT_DIR" ]; then
  TOTAL_FILES=$(find "$OUTPUT_DIR" -type f | wc -l)
  TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)

  cat > "$OUTPUT_DIR/.pitr-recovery-info.json" << PITREOF
{
  "recovery_type": "archive-pitr",
  "target_timestamp": "${TARGET_TIMESTAMP:-null}",
  "target_commit": "${TARGET_COMMIT:-null}",
  "recovered_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files_recovered": $TOTAL_FILES,
  "output_directory": "$OUTPUT_DIR",
  "source": "${CLOSEST_COMMIT:-${BEST_BACKUP:-git}}"
}
PITREOF

  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Point-in-Time Recovery Complete${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Output:     ${GREEN}$OUTPUT_DIR${NC}"
  echo -e "Files:      ${GREEN}$TOTAL_FILES${NC}"
  echo -e "Size:       ${GREEN}$TOTAL_SIZE${NC}"
  echo ""
  echo -e "${YELLOW}To apply this recovery:${NC}"
  echo "  1. Review recovered files:  ls $OUTPUT_DIR"
  echo "  2. Compare with current:    diff -r $OUTPUT_DIR archive/"
  echo "  3. Replace archive:         rm -rf archive/ && mv $OUTPUT_DIR archive/"
  echo "  4. Or selective restore:    cp -r $OUTPUT_DIR/<path> archive/<path>"
else
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Dry Run Complete${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
fi
