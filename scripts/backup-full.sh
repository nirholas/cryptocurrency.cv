#!/bin/bash

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

#
# Full Disaster Recovery Backup Script
#
# Performs a comprehensive backup of all system data:
# 1. Postgres database via pg_dump
# 2. Redis key snapshot
# 3. Archive directory tar
# 4. Upload to S3-compatible storage with timestamp
# 5. Verify backup integrity
#
# Environment variables:
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE  - Postgres connection
#   DATABASE_URL                                      - or connection string
#   REDIS_URL                                         - Redis connection (default: redis://localhost:6379)
#   BACKUP_S3_BUCKET                                  - S3 bucket name
#   BACKUP_S3_ENDPOINT                                - S3 endpoint (for MinIO, R2, etc.)
#   BACKUP_S3_REGION                                  - S3 region (default: us-east-1)
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY          - S3 credentials
#   BACKUP_RETENTION_DAYS                             - Days to keep backups (default: 30)
#   BACKUP_DIR                                        - Local staging dir (default: ./backups)
#   BACKUP_ENCRYPTION_KEY                             - Optional GPG passphrase for encryption
#
# Usage:
#   ./scripts/backup-full.sh                  # Full backup (all components)
#   ./scripts/backup-full.sh --postgres       # Postgres only
#   ./scripts/backup-full.sh --redis          # Redis only
#   ./scripts/backup-full.sh --archive        # Archive directory only
#   ./scripts/backup-full.sh --no-upload      # Skip S3 upload
#   ./scripts/backup-full.sh --no-verify      # Skip integrity verification
#   ./scripts/backup-full.sh --dry-run        # Show what would be done
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

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
DATE_DIR=$(date -u +"%Y/%m/%d")
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_NAME="full-backup_${TIMESTAMP}"
STAGING_DIR="$BACKUP_DIR/staging/$BACKUP_NAME"
STATUS_FILE="$BACKUP_DIR/.last-backup-status.json"

# S3 configuration
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_REGION="${BACKUP_S3_REGION:-us-east-1}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Flags
DO_POSTGRES=false
DO_REDIS=false
DO_ARCHIVE=false
DO_UPLOAD=true
DO_VERIFY=true
DRY_RUN=false
FULL_BACKUP=true

# Track results
ERRORS=()
WARNINGS=()
COMPONENTS_BACKED_UP=()
TOTAL_SIZE=0

# ============================================================================
# Argument Parsing
# ============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --postgres)   DO_POSTGRES=true; FULL_BACKUP=false; shift ;;
    --redis)      DO_REDIS=true; FULL_BACKUP=false; shift ;;
    --archive)    DO_ARCHIVE=true; FULL_BACKUP=false; shift ;;
    --no-upload)  DO_UPLOAD=false; shift ;;
    --no-verify)  DO_VERIFY=false; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --help|-h)
      echo "Usage: $0 [--postgres] [--redis] [--archive] [--no-upload] [--no-verify] [--dry-run]"
      echo ""
      echo "Without component flags, performs a full backup of all components."
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# If full backup, enable all components
if [ "$FULL_BACKUP" = true ]; then
  DO_POSTGRES=true
  DO_REDIS=true
  DO_ARCHIVE=true
fi

# ============================================================================
# Utility Functions
# ============================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; WARNINGS+=("$*"); }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; ERRORS+=("$*"); }
log_step()    { echo -e "${CYAN}[STEP]${NC}  $*"; }

human_size() {
  local bytes=$1
  if [ "$bytes" -ge 1073741824 ]; then
    echo "$(echo "scale=2; $bytes/1073741824" | bc) GB"
  elif [ "$bytes" -ge 1048576 ]; then
    echo "$(echo "scale=2; $bytes/1048576" | bc) MB"
  elif [ "$bytes" -ge 1024 ]; then
    echo "$(echo "scale=2; $bytes/1024" | bc) KB"
  else
    echo "$bytes B"
  fi
}

file_size_bytes() {
  stat -c%s "$1" 2>/dev/null || echo 0
}

check_command() {
  if ! command -v "$1" &>/dev/null; then
    return 1
  fi
  return 0
}

write_status() {
  local status=$1
  local message=$2
  local end_time
  end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  mkdir -p "$(dirname "$STATUS_FILE")"
  cat > "$STATUS_FILE" << STATUSEOF
{
  "timestamp": "$TIMESTAMP",
  "status": "$status",
  "message": "$message",
  "backup_name": "$BACKUP_NAME",
  "started_at": "$START_TIME",
  "completed_at": "$end_time",
  "components": $(printf '%s\n' "${COMPONENTS_BACKED_UP[@]:-}" | jq -R . | jq -s .),
  "errors": $(printf '%s\n' "${ERRORS[@]:-}" | jq -R . | jq -s .),
  "warnings": $(printf '%s\n' "${WARNINGS[@]:-}" | jq -R . | jq -s .),
  "total_size_bytes": $TOTAL_SIZE,
  "total_size_human": "$(human_size $TOTAL_SIZE)",
  "s3_bucket": "${S3_BUCKET:-none}",
  "s3_path": "backups/${DATE_DIR}/${BACKUP_NAME}.tar.gz",
  "retention_days": $RETENTION_DAYS,
  "dry_run": $DRY_RUN
}
STATUSEOF
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Disaster Recovery - Full Backup${NC}"
echo -e "${BLUE}  $TIMESTAMP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warn "DRY RUN mode — no changes will be made"
  echo ""
fi

# Check required tools
log_step "Pre-flight checks..."

if [ "$DO_POSTGRES" = true ]; then
  if ! check_command pg_dump; then
    log_warn "pg_dump not found — Postgres backup will be skipped"
    DO_POSTGRES=false
  fi
fi

if [ "$DO_REDIS" = true ]; then
  if ! check_command redis-cli; then
    log_warn "redis-cli not found — Redis backup will be skipped"
    DO_REDIS=false
  fi
fi

if [ "$DO_UPLOAD" = true ] && [ -n "$S3_BUCKET" ]; then
  if ! check_command aws; then
    log_warn "aws CLI not found — S3 upload will be skipped"
    DO_UPLOAD=false
  fi
fi

if ! check_command jq; then
  log_warn "jq not found — status file will use basic format"
fi

if ! check_command sha256sum; then
  log_warn "sha256sum not found — integrity verification will use md5sum"
fi

log_success "Pre-flight checks complete"
echo ""

# Create staging directory
if [ "$DRY_RUN" = false ]; then
  mkdir -p "$STAGING_DIR"
fi

# ============================================================================
# 1. Postgres Backup
# ============================================================================

if [ "$DO_POSTGRES" = true ]; then
  log_step "Backing up Postgres database..."

  PG_DUMP_FILE="$STAGING_DIR/postgres.sql.gz"

  # Resolve connection parameters
  if [ -n "${DATABASE_URL:-}" ]; then
    PG_CONN="$DATABASE_URL"
  else
    PG_HOST="${PGHOST:-localhost}"
    PG_PORT="${PGPORT:-5432}"
    PG_USER="${PGUSER:-postgres}"
    PG_DB="${PGDATABASE:-free_crypto_news}"
    PG_CONN="postgresql://${PG_USER}:${PGPASSWORD:-}@${PG_HOST}:${PG_PORT}/${PG_DB}"
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "Would run: pg_dump → $PG_DUMP_FILE"
  else
    if pg_dump "$PG_CONN" \
      --format=custom \
      --compress=6 \
      --no-owner \
      --no-privileges \
      --verbose \
      2>"$STAGING_DIR/postgres-dump.log" \
      | gzip > "$PG_DUMP_FILE"; then

      PG_SIZE=$(file_size_bytes "$PG_DUMP_FILE")
      TOTAL_SIZE=$((TOTAL_SIZE + PG_SIZE))
      COMPONENTS_BACKED_UP+=("postgres")
      log_success "Postgres backup: $(human_size $PG_SIZE)"

      # Also dump schema separately for quick reference
      pg_dump "$PG_CONN" \
        --schema-only \
        --no-owner \
        --no-privileges \
        > "$STAGING_DIR/postgres-schema.sql" 2>/dev/null || true

    else
      log_error "Postgres backup failed (see $STAGING_DIR/postgres-dump.log)"
    fi
  fi
  echo ""
fi

# ============================================================================
# 2. Redis Snapshot
# ============================================================================

if [ "$DO_REDIS" = true ]; then
  log_step "Snapshotting Redis keys..."

  REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
  REDIS_DUMP_FILE="$STAGING_DIR/redis-snapshot.json.gz"

  if [ "$DRY_RUN" = true ]; then
    log_info "Would snapshot Redis keys → $REDIS_DUMP_FILE"
  else
    # Parse Redis URL for redis-cli flags
    REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://([^:@]+).*|\1|; s|redis://.*@([^:]+).*|\1|')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|.*:([0-9]+)/?$|\1|')
    REDIS_PASS=$(echo "$REDIS_URL" | sed -nE 's|redis://:[^@]+@.*|\0|p' | sed -E 's|redis://:([^@]+)@.*|\1|')

    REDIS_CLI_ARGS=(-h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}")
    if [ -n "${REDIS_PASS:-}" ]; then
      REDIS_CLI_ARGS+=(-a "$REDIS_PASS" --no-auth-warning)
    fi

    # Export all keys as JSON
    REDIS_TEMP="$STAGING_DIR/redis-keys.json"
    echo "{" > "$REDIS_TEMP"

    FIRST_KEY=true
    while IFS= read -r key; do
      [ -z "$key" ] && continue
      
      KEY_TYPE=$(redis-cli "${REDIS_CLI_ARGS[@]}" TYPE "$key" 2>/dev/null | tr -d '[:space:]')
      
      case "$KEY_TYPE" in
        string)
          VALUE=$(redis-cli "${REDIS_CLI_ARGS[@]}" GET "$key" 2>/dev/null)
          ;;
        list)
          VALUE=$(redis-cli "${REDIS_CLI_ARGS[@]}" LRANGE "$key" 0 -1 2>/dev/null | jq -R . | jq -s .)
          ;;
        set)
          VALUE=$(redis-cli "${REDIS_CLI_ARGS[@]}" SMEMBERS "$key" 2>/dev/null | jq -R . | jq -s .)
          ;;
        hash)
          VALUE=$(redis-cli "${REDIS_CLI_ARGS[@]}" HGETALL "$key" 2>/dev/null | jq -R . | jq -s 'def pairs: if length == 0 then {} elif length == 1 then {(.[0]): null} else {(.[0]): .[1]} + (.[2:] | pairs) end; pairs')
          ;;
        zset)
          VALUE=$(redis-cli "${REDIS_CLI_ARGS[@]}" ZRANGE "$key" 0 -1 WITHSCORES 2>/dev/null | jq -R . | jq -s .)
          ;;
        *)
          VALUE="null"
          ;;
      esac

      TTL=$(redis-cli "${REDIS_CLI_ARGS[@]}" TTL "$key" 2>/dev/null | tr -d '[:space:]')

      if [ "$FIRST_KEY" = true ]; then
        FIRST_KEY=false
      else
        echo "," >> "$REDIS_TEMP"
      fi

      jq -n \
        --arg key "$key" \
        --arg type "$KEY_TYPE" \
        --argjson ttl "${TTL:--1}" \
        --argjson value "${VALUE:-null}" \
        '"\($key)": {"type": $type, "ttl": $ttl, "value": $value}' >> "$REDIS_TEMP" 2>/dev/null || \
      echo "\"$(echo "$key" | jq -R .)\": {\"type\": \"$KEY_TYPE\", \"ttl\": ${TTL:--1}, \"value\": null}" >> "$REDIS_TEMP"

    done < <(redis-cli "${REDIS_CLI_ARGS[@]}" KEYS "*" 2>/dev/null)

    echo "}" >> "$REDIS_TEMP"

    # Compress
    gzip -c "$REDIS_TEMP" > "$REDIS_DUMP_FILE"
    rm -f "$REDIS_TEMP"

    REDIS_SIZE=$(file_size_bytes "$REDIS_DUMP_FILE")
    TOTAL_SIZE=$((TOTAL_SIZE + REDIS_SIZE))
    COMPONENTS_BACKED_UP+=("redis")
    log_success "Redis snapshot: $(human_size $REDIS_SIZE)"
  fi
  echo ""
fi

# ============================================================================
# 3. Archive Directory
# ============================================================================

if [ "$DO_ARCHIVE" = true ]; then
  log_step "Archiving the archive directory..."

  ARCHIVE_DIR="$PROJECT_ROOT/archive"
  ARCHIVE_TAR="$STAGING_DIR/archive.tar.gz"

  if [ ! -d "$ARCHIVE_DIR" ]; then
    log_warn "Archive directory not found: $ARCHIVE_DIR"
  elif [ "$DRY_RUN" = true ]; then
    ARCHIVE_EST_SIZE=$(du -sb "$ARCHIVE_DIR" 2>/dev/null | cut -f1)
    log_info "Would tar $ARCHIVE_DIR (~$(human_size ${ARCHIVE_EST_SIZE:-0}))"
  else
    # Create tar with checksums
    tar -czf "$ARCHIVE_TAR" \
      -C "$PROJECT_ROOT" \
      --exclude='*.tmp' \
      --exclude='.DS_Store' \
      archive/

    ARCHIVE_SIZE=$(file_size_bytes "$ARCHIVE_TAR")
    TOTAL_SIZE=$((TOTAL_SIZE + ARCHIVE_SIZE))
    COMPONENTS_BACKED_UP+=("archive")
    log_success "Archive backup: $(human_size $ARCHIVE_SIZE)"

    # Generate file listing for PITR reference
    find "$ARCHIVE_DIR" -type f -printf '%T@ %P\n' 2>/dev/null | \
      sort -rn | head -1000 > "$STAGING_DIR/archive-file-list.txt" || true
  fi
  echo ""
fi

# ============================================================================
# Create Backup Manifest & Checksums
# ============================================================================

log_step "Creating backup manifest..."

if [ "$DRY_RUN" = false ]; then
  # Generate checksums for all backup files
  CHECKSUM_FILE="$STAGING_DIR/checksums.sha256"
  if check_command sha256sum; then
    find "$STAGING_DIR" -type f ! -name "checksums.sha256" ! -name "manifest.json" -exec sha256sum {} \; > "$CHECKSUM_FILE"
  elif check_command md5sum; then
    find "$STAGING_DIR" -type f ! -name "checksums.md5" ! -name "manifest.json" -exec md5sum {} \; > "$STAGING_DIR/checksums.md5"
  fi

  # Build manifest
  cat > "$STAGING_DIR/manifest.json" << MANIFESTEOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "started_at": "$START_TIME",
  "completed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "components": $(printf '%s\n' "${COMPONENTS_BACKED_UP[@]:-}" | jq -R . | jq -s .),
  "project_version": "$(cd "$PROJECT_ROOT" && node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')",
  "git_commit": "$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo 'unknown')",
  "total_size_bytes": $TOTAL_SIZE,
  "hostname": "$(hostname)",
  "node_env": "${NODE_ENV:-development}"
}
MANIFESTEOF

  log_success "Manifest created"
fi
echo ""

# ============================================================================
# Create Final Archive
# ============================================================================

log_step "Creating final backup archive..."

FINAL_ARCHIVE="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

if [ "$DRY_RUN" = false ]; then
  cd "$BACKUP_DIR/staging"
  tar -czf "$FINAL_ARCHIVE" "$BACKUP_NAME"
  rm -rf "$STAGING_DIR"
  rmdir "$BACKUP_DIR/staging" 2>/dev/null || true

  # Generate checksum for the final archive
  if check_command sha256sum; then
    sha256sum "$FINAL_ARCHIVE" > "$FINAL_ARCHIVE.sha256"
  fi

  FINAL_SIZE=$(file_size_bytes "$FINAL_ARCHIVE")
  log_success "Final archive: $(human_size $FINAL_SIZE)"

  # Optional encryption
  if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    log_step "Encrypting backup..."
    gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
      --symmetric --cipher-algo AES256 \
      -o "$FINAL_ARCHIVE.gpg" "$FINAL_ARCHIVE"
    rm -f "$FINAL_ARCHIVE" "$FINAL_ARCHIVE.sha256"
    FINAL_ARCHIVE="$FINAL_ARCHIVE.gpg"
    sha256sum "$FINAL_ARCHIVE" > "$FINAL_ARCHIVE.sha256"
    log_success "Backup encrypted with AES-256"
  fi
fi
echo ""

# ============================================================================
# 4. Upload to S3
# ============================================================================

if [ "$DO_UPLOAD" = true ] && [ -n "$S3_BUCKET" ]; then
  log_step "Uploading to S3..."

  S3_PATH="s3://$S3_BUCKET/backups/$DATE_DIR/$(basename "$FINAL_ARCHIVE")"
  AWS_ARGS=(--region "$S3_REGION")

  if [ -n "$S3_ENDPOINT" ]; then
    AWS_ARGS+=(--endpoint-url "$S3_ENDPOINT")
  fi

  if [ "$DRY_RUN" = true ]; then
    log_info "Would upload to: $S3_PATH"
  else
    # Upload the archive
    if aws s3 cp "$FINAL_ARCHIVE" "$S3_PATH" "${AWS_ARGS[@]}"; then
      log_success "Uploaded: $S3_PATH"
      COMPONENTS_BACKED_UP+=("s3-upload")

      # Upload checksum
      if [ -f "$FINAL_ARCHIVE.sha256" ]; then
        aws s3 cp "$FINAL_ARCHIVE.sha256" "$S3_PATH.sha256" "${AWS_ARGS[@]}" || true
      fi

      # Upload manifest separately for quick lookup
      if [ -f "$STAGING_DIR/manifest.json" ] 2>/dev/null; then
        aws s3 cp "$STAGING_DIR/manifest.json" \
          "s3://$S3_BUCKET/backups/$DATE_DIR/manifest.json" "${AWS_ARGS[@]}" || true
      fi
    else
      log_error "S3 upload failed"
    fi

    # Cleanup old remote backups
    if [ "$RETENTION_DAYS" -gt 0 ]; then
      log_step "Pruning remote backups older than $RETENTION_DAYS days..."
      CUTOFF_DATE=$(date -u -d "$RETENTION_DAYS days ago" +"%Y-%m-%d" 2>/dev/null || \
                    date -u -v-${RETENTION_DAYS}d +"%Y-%m-%d" 2>/dev/null || echo "")
      if [ -n "$CUTOFF_DATE" ]; then
        aws s3 ls "s3://$S3_BUCKET/backups/" "${AWS_ARGS[@]}" 2>/dev/null | \
          awk '{print $NF}' | while read -r prefix; do
            prefix_date=$(echo "$prefix" | tr '/' '-' | head -c10)
            if [[ "$prefix_date" < "$CUTOFF_DATE" ]]; then
              log_info "Removing old backup: $prefix"
              aws s3 rm "s3://$S3_BUCKET/backups/$prefix" --recursive "${AWS_ARGS[@]}" 2>/dev/null || true
            fi
          done
        log_success "Remote pruning complete"
      fi
    fi
  fi
  echo ""
elif [ "$DO_UPLOAD" = true ] && [ -z "$S3_BUCKET" ]; then
  log_warn "BACKUP_S3_BUCKET not set — skipping S3 upload"
  echo ""
fi

# ============================================================================
# 5. Verify Backup Integrity
# ============================================================================

if [ "$DO_VERIFY" = true ] && [ "$DRY_RUN" = false ]; then
  log_step "Verifying backup integrity..."

  VERIFY_DIR=$(mktemp -d)
  VERIFY_OK=true

  # Extract and verify
  if tar -xzf "$FINAL_ARCHIVE" -C "$VERIFY_DIR" 2>/dev/null; then
    log_success "Archive extraction: OK"

    # Verify checksums
    EXTRACTED_DIR="$VERIFY_DIR/$BACKUP_NAME"
    if [ -f "$EXTRACTED_DIR/checksums.sha256" ]; then
      cd "$EXTRACTED_DIR"
      if sha256sum -c checksums.sha256 &>/dev/null; then
        log_success "SHA-256 checksums: OK"
      else
        log_error "SHA-256 checksum verification failed!"
        VERIFY_OK=false
      fi
      cd "$PROJECT_ROOT"
    fi

    # Verify manifest is valid JSON
    if [ -f "$EXTRACTED_DIR/manifest.json" ]; then
      if jq empty "$EXTRACTED_DIR/manifest.json" 2>/dev/null; then
        log_success "Manifest JSON: OK"
      else
        log_error "Manifest JSON is invalid"
        VERIFY_OK=false
      fi
    fi

    # Verify Postgres dump if present
    if [ -f "$EXTRACTED_DIR/postgres.sql.gz" ]; then
      if gzip -t "$EXTRACTED_DIR/postgres.sql.gz" 2>/dev/null; then
        log_success "Postgres dump integrity: OK"
      else
        log_error "Postgres dump is corrupted"
        VERIFY_OK=false
      fi
    fi

    # Verify Redis snapshot if present
    if [ -f "$EXTRACTED_DIR/redis-snapshot.json.gz" ]; then
      if gzip -t "$EXTRACTED_DIR/redis-snapshot.json.gz" 2>/dev/null; then
        log_success "Redis snapshot integrity: OK"
      else
        log_error "Redis snapshot is corrupted"
        VERIFY_OK=false
      fi
    fi

    # Verify archive tar if present
    if [ -f "$EXTRACTED_DIR/archive.tar.gz" ]; then
      if tar -tzf "$EXTRACTED_DIR/archive.tar.gz" &>/dev/null; then
        log_success "Archive tar integrity: OK"
      else
        log_error "Archive tar is corrupted"
        VERIFY_OK=false
      fi
    fi

  else
    log_error "Failed to extract backup archive"
    VERIFY_OK=false
  fi

  rm -rf "$VERIFY_DIR"

  if [ "$VERIFY_OK" = true ]; then
    log_success "All integrity checks passed"
  else
    log_error "Integrity verification FAILED"
  fi
  echo ""
fi

# ============================================================================
# Local Retention Cleanup
# ============================================================================

log_step "Cleaning local backups..."

if [ "$DRY_RUN" = false ]; then
  ls -t "$BACKUP_DIR"/full-backup_*.tar.gz* 2>/dev/null | \
    grep -v '.sha256$' | tail -n +11 | while read -r old_backup; do
    rm -f "$old_backup" "${old_backup}.sha256"
    log_info "Removed old backup: $(basename "$old_backup")"
  done

  KEPT=$(ls -1 "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null | grep -v '.sha256$' | wc -l)
  log_success "Keeping $KEPT local backups"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "${RED}  Backup completed with errors${NC}"
  write_status "error" "Completed with ${#ERRORS[@]} error(s)"
else
  echo -e "${GREEN}  Backup completed successfully${NC}"
  write_status "success" "All components backed up"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "Backup:     ${GREEN}$BACKUP_NAME${NC}"
echo -e "Components: ${GREEN}${COMPONENTS_BACKED_UP[*]:-none}${NC}"
echo -e "Size:       ${GREEN}$(human_size $TOTAL_SIZE)${NC}"
if [ -n "$S3_BUCKET" ] && [ "$DO_UPLOAD" = true ]; then
  echo -e "S3:         ${GREEN}s3://$S3_BUCKET/backups/$DATE_DIR/${NC}"
fi
echo -e "Duration:   ${GREEN}$(($(date +%s) - $(date -d "$START_TIME" +%s 2>/dev/null || echo $(date +%s))))s${NC}"

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Warnings:${NC}"
  for w in "${WARNINGS[@]}"; do
    echo -e "  ${YELLOW}⚠${NC}  $w"
  done
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Errors:${NC}"
  for e in "${ERRORS[@]}"; do
    echo -e "  ${RED}✗${NC}  $e"
  done
  exit 1
fi

echo ""
log_success "Backup status saved to $STATUS_FILE"
