#!/bin/bash

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

#
# Full Disaster Recovery Restore Script
#
# Restores system data from a backup created by backup-full.sh:
# 1. Verify backup integrity
# 2. Restore Postgres database
# 3. Restore Redis keys
# 4. Restore archive directory
#
# Environment variables:
#   Same as backup-full.sh for database/Redis/S3 connections
#   RESTORE_CONFIRM=yes                    - Skip interactive confirmation
#
# Usage:
#   ./scripts/restore-full.sh <backup-file>              # Restore from local file
#   ./scripts/restore-full.sh --from-s3 <s3-path>        # Restore from S3
#   ./scripts/restore-full.sh --latest                    # Restore latest local backup
#   ./scripts/restore-full.sh <file> --postgres           # Restore only Postgres
#   ./scripts/restore-full.sh <file> --redis              # Restore only Redis
#   ./scripts/restore-full.sh <file> --archive            # Restore only archive
#   ./scripts/restore-full.sh <file> --dry-run            # Preview without restoring
#   ./scripts/restore-full.sh --list                      # List available backups
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

# S3 configuration
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_REGION="${BACKUP_S3_REGION:-us-east-1}"

# Flags
BACKUP_FILE=""
FROM_S3=""
USE_LATEST=false
DO_POSTGRES=false
DO_REDIS=false
DO_ARCHIVE=false
FULL_RESTORE=true
DRY_RUN=false
LIST_BACKUPS=false

# ============================================================================
# Argument Parsing
# ============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --from-s3)   FROM_S3="$2"; shift 2 ;;
    --latest)    USE_LATEST=true; shift ;;
    --list)      LIST_BACKUPS=true; shift ;;
    --postgres)  DO_POSTGRES=true; FULL_RESTORE=false; shift ;;
    --redis)     DO_REDIS=true; FULL_RESTORE=false; shift ;;
    --archive)   DO_ARCHIVE=true; FULL_RESTORE=false; shift ;;
    --dry-run)   DRY_RUN=true; shift ;;
    --help|-h)
      echo "Usage: $0 <backup-file> [--postgres] [--redis] [--archive] [--dry-run]"
      echo "       $0 --from-s3 <s3://path> [options]"
      echo "       $0 --latest [options]"
      echo "       $0 --list"
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"; exit 1 ;;
    *)
      BACKUP_FILE="$1"; shift ;;
  esac
done

if [ "$FULL_RESTORE" = true ]; then
  DO_POSTGRES=true
  DO_REDIS=true
  DO_ARCHIVE=true
fi

# ============================================================================
# Utility Functions
# ============================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()    { echo -e "${CYAN}[STEP]${NC}  $*"; }

check_command() {
  command -v "$1" &>/dev/null
}

# ============================================================================
# List Available Backups
# ============================================================================

if [ "$LIST_BACKUPS" = true ]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Available Backups${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""

  echo -e "${CYAN}Local backups ($BACKUP_DIR):${NC}"
  if ls "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null | head -20; then
    echo ""
    for f in $(ls -t "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null | head -10); do
      SIZE=$(du -h "$f" | cut -f1)
      DATE=$(basename "$f" | sed 's/full-backup_//;s/\.tar\.gz//')
      echo -e "  ${GREEN}$(basename "$f")${NC}  ($SIZE)  $DATE"
    done
  else
    echo "  No local backups found"
  fi

  if [ -n "$S3_BUCKET" ] && check_command aws; then
    echo ""
    echo -e "${CYAN}Remote backups (s3://$S3_BUCKET/backups/):${NC}"
    AWS_ARGS=(--region "$S3_REGION")
    [ -n "$S3_ENDPOINT" ] && AWS_ARGS+=(--endpoint-url "$S3_ENDPOINT")
    aws s3 ls "s3://$S3_BUCKET/backups/" --recursive "${AWS_ARGS[@]}" 2>/dev/null | \
      grep '\.tar\.gz$' | tail -20 | while read -r line; do
        echo "  $line"
      done
  fi

  exit 0
fi

# ============================================================================
# Resolve Backup File
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Disaster Recovery - Restore${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warn "DRY RUN mode — no changes will be made"
  echo ""
fi

# Download from S3 if requested
if [ -n "$FROM_S3" ]; then
  log_step "Downloading backup from S3..."
  
  AWS_ARGS=(--region "$S3_REGION")
  [ -n "$S3_ENDPOINT" ] && AWS_ARGS+=(--endpoint-url "$S3_ENDPOINT")

  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/$(basename "$FROM_S3")"

  if [ "$DRY_RUN" = true ]; then
    log_info "Would download: $FROM_S3 → $BACKUP_FILE"
  else
    aws s3 cp "$FROM_S3" "$BACKUP_FILE" "${AWS_ARGS[@]}"
    log_success "Downloaded: $(basename "$BACKUP_FILE")"
  fi
  echo ""
fi

# Use latest local backup
if [ "$USE_LATEST" = true ]; then
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/full-backup_*.tar.gz 2>/dev/null | head -1)
  if [ -z "$BACKUP_FILE" ]; then
    log_error "No local backups found in $BACKUP_DIR"
    exit 1
  fi
  log_info "Using latest backup: $(basename "$BACKUP_FILE")"
fi

# Validate we have a backup file
if [ -z "$BACKUP_FILE" ]; then
  log_error "No backup file specified. Use: $0 <backup-file>, --latest, or --from-s3 <path>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ] && [ "$DRY_RUN" = false ]; then
  # Handle encrypted backups
  if [ -f "$BACKUP_FILE.gpg" ]; then
    log_step "Decrypting backup..."
    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
      log_error "BACKUP_ENCRYPTION_KEY required to decrypt backup"
      exit 1
    fi
    gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
      --decrypt -o "$BACKUP_FILE" "$BACKUP_FILE.gpg"
    log_success "Backup decrypted"
  else
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi
fi

# ============================================================================
# Verify Backup Integrity
# ============================================================================

log_step "Verifying backup integrity..."

if [ "$DRY_RUN" = false ]; then
  # Check SHA-256 if available
  if [ -f "$BACKUP_FILE.sha256" ]; then
    if sha256sum -c "$BACKUP_FILE.sha256" &>/dev/null; then
      log_success "SHA-256 checksum: OK"
    else
      log_error "SHA-256 checksum FAILED — backup may be corrupted"
      exit 1
    fi
  fi

  # Test archive integrity
  if ! tar -tzf "$BACKUP_FILE" &>/dev/null; then
    log_error "Archive is corrupted — cannot extract"
    exit 1
  fi
  log_success "Archive integrity: OK"
fi
echo ""

# ============================================================================
# Extract Backup
# ============================================================================

log_step "Extracting backup..."

RESTORE_DIR=$(mktemp -d)

if [ "$DRY_RUN" = false ]; then
  tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

  # Find the extracted directory
  EXTRACTED_DIR=$(find "$RESTORE_DIR" -maxdepth 1 -type d ! -path "$RESTORE_DIR" | head -1)
  if [ -z "$EXTRACTED_DIR" ]; then
    log_error "Could not find extracted backup content"
    rm -rf "$RESTORE_DIR"
    exit 1
  fi

  # Verify internal checksums
  if [ -f "$EXTRACTED_DIR/checksums.sha256" ]; then
    cd "$EXTRACTED_DIR"
    if sha256sum -c checksums.sha256 &>/dev/null; then
      log_success "Internal checksums: OK"
    else
      log_error "Internal checksum verification failed"
      cd "$PROJECT_ROOT"
      rm -rf "$RESTORE_DIR"
      exit 1
    fi
    cd "$PROJECT_ROOT"
  fi

  # Show manifest
  if [ -f "$EXTRACTED_DIR/manifest.json" ]; then
    echo ""
    log_info "Backup manifest:"
    jq -r '. | "  Backup:    \(.backup_name)\n  Date:      \(.timestamp)\n  Version:   \(.project_version)\n  Commit:    \(.git_commit)\n  Components: \(.components | join(", "))"' \
      "$EXTRACTED_DIR/manifest.json" 2>/dev/null || cat "$EXTRACTED_DIR/manifest.json"
  fi

  log_success "Extraction complete"
else
  log_info "Would extract: $BACKUP_FILE"
fi
echo ""

# ============================================================================
# Confirmation
# ============================================================================

if [ "$DRY_RUN" = false ] && [ "${RESTORE_CONFIRM:-}" != "yes" ]; then
  echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  WARNING: This will overwrite existing data!          ║${NC}"
  echo -e "${RED}║  Components to restore: $(printf '%-29s' "${DO_POSTGRES:+postgres }${DO_REDIS:+redis }${DO_ARCHIVE:+archive}")║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
  echo ""
  read -r -p "Type 'RESTORE' to confirm: " CONFIRM
  if [ "$CONFIRM" != "RESTORE" ]; then
    log_info "Restore cancelled"
    rm -rf "$RESTORE_DIR"
    exit 0
  fi
  echo ""
fi

# ============================================================================
# 1. Restore Postgres
# ============================================================================

if [ "$DO_POSTGRES" = true ]; then
  log_step "Restoring Postgres database..."

  PG_DUMP_FILE="$EXTRACTED_DIR/postgres.sql.gz"

  if [ ! -f "$PG_DUMP_FILE" ]; then
    log_warn "Postgres dump not found in backup — skipping"
  elif ! check_command pg_restore && ! check_command psql; then
    log_warn "pg_restore/psql not found — skipping Postgres restore"
  elif [ "$DRY_RUN" = true ]; then
    log_info "Would restore Postgres from: $PG_DUMP_FILE"
  else
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

    # The dump is pg_dump --format=custom piped through gzip
    gunzip -c "$PG_DUMP_FILE" | pg_restore \
      --dbname="$PG_CONN" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      --verbose \
      2>"$RESTORE_DIR/postgres-restore.log" || {
        # pg_restore often returns non-zero even on partial success
        log_warn "pg_restore reported warnings (see log)"
      }

    log_success "Postgres restored"
  fi
  echo ""
fi

# ============================================================================
# 2. Restore Redis
# ============================================================================

if [ "$DO_REDIS" = true ]; then
  log_step "Restoring Redis keys..."

  REDIS_DUMP_FILE="$EXTRACTED_DIR/redis-snapshot.json.gz"

  if [ ! -f "$REDIS_DUMP_FILE" ]; then
    log_warn "Redis snapshot not found in backup — skipping"
  elif ! check_command redis-cli; then
    log_warn "redis-cli not found — skipping Redis restore"
  elif [ "$DRY_RUN" = true ]; then
    log_info "Would restore Redis from: $REDIS_DUMP_FILE"
  else
    REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
    REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://([^:@]+).*|\1|; s|redis://.*@([^:]+).*|\1|')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|.*:([0-9]+)/?$|\1|')
    REDIS_PASS=$(echo "$REDIS_URL" | sed -nE 's|redis://:[^@]+@.*|\0|p' | sed -E 's|redis://:([^@]+)@.*|\1|')

    REDIS_CLI_ARGS=(-h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}")
    if [ -n "${REDIS_PASS:-}" ]; then
      REDIS_CLI_ARGS+=(-a "$REDIS_PASS" --no-auth-warning)
    fi

    # Decompress and parse JSON to restore keys
    REDIS_JSON=$(gunzip -c "$REDIS_DUMP_FILE")
    
    RESTORED_COUNT=0

    echo "$REDIS_JSON" | jq -r 'to_entries[] | @base64' | while read -r entry; do
      KEY=$(echo "$entry" | base64 -d | jq -r '.key')
      TYPE=$(echo "$entry" | base64 -d | jq -r '.value.type')
      TTL=$(echo "$entry" | base64 -d | jq -r '.value.ttl')
      VALUE=$(echo "$entry" | base64 -d | jq -r '.value.value')

      case "$TYPE" in
        string)
          redis-cli "${REDIS_CLI_ARGS[@]}" SET "$KEY" "$VALUE" &>/dev/null
          ;;
        list)
          redis-cli "${REDIS_CLI_ARGS[@]}" DEL "$KEY" &>/dev/null
          echo "$VALUE" | jq -r '.[]' | while read -r item; do
            redis-cli "${REDIS_CLI_ARGS[@]}" RPUSH "$KEY" "$item" &>/dev/null
          done
          ;;
        set)
          redis-cli "${REDIS_CLI_ARGS[@]}" DEL "$KEY" &>/dev/null
          echo "$VALUE" | jq -r '.[]' | while read -r item; do
            redis-cli "${REDIS_CLI_ARGS[@]}" SADD "$KEY" "$item" &>/dev/null
          done
          ;;
        hash)
          redis-cli "${REDIS_CLI_ARGS[@]}" DEL "$KEY" &>/dev/null
          echo "$VALUE" | jq -r 'to_entries[] | "\(.key)\n\(.value)"' | while read -r field && read -r val; do
            redis-cli "${REDIS_CLI_ARGS[@]}" HSET "$KEY" "$field" "$val" &>/dev/null
          done
          ;;
        zset)
          redis-cli "${REDIS_CLI_ARGS[@]}" DEL "$KEY" &>/dev/null
          # zset stored as [member, score, member, score, ...]
          echo "$VALUE" | jq -r 'range(0; length; 2) as $i | "\(.[$i])\n\(.[$i+1])"' | \
            while read -r member && read -r score; do
              redis-cli "${REDIS_CLI_ARGS[@]}" ZADD "$KEY" "$score" "$member" &>/dev/null
            done
          ;;
      esac

      # Set TTL if applicable
      if [ "$TTL" -gt 0 ] 2>/dev/null; then
        redis-cli "${REDIS_CLI_ARGS[@]}" EXPIRE "$KEY" "$TTL" &>/dev/null
      fi

      RESTORED_COUNT=$((RESTORED_COUNT + 1))
    done

    log_success "Redis keys restored"
  fi
  echo ""
fi

# ============================================================================
# 3. Restore Archive Directory
# ============================================================================

if [ "$DO_ARCHIVE" = true ]; then
  log_step "Restoring archive directory..."

  ARCHIVE_TAR="$EXTRACTED_DIR/archive.tar.gz"

  if [ ! -f "$ARCHIVE_TAR" ]; then
    log_warn "Archive tar not found in backup — skipping"
  elif [ "$DRY_RUN" = true ]; then
    log_info "Would restore archive to: $PROJECT_ROOT/archive/"
  else
    # Create a safety backup of current archive
    if [ -d "$PROJECT_ROOT/archive" ]; then
      SAFETY_BACKUP="$BACKUP_DIR/archive-pre-restore_$(date +%Y%m%d%H%M%S).tar.gz"
      log_info "Creating safety backup: $SAFETY_BACKUP"
      tar -czf "$SAFETY_BACKUP" -C "$PROJECT_ROOT" archive/ 2>/dev/null || true
    fi

    # Extract archive
    tar -xzf "$ARCHIVE_TAR" -C "$PROJECT_ROOT"
    log_success "Archive directory restored"
  fi
  echo ""
fi

# ============================================================================
# Cleanup & Summary
# ============================================================================

if [ "$DRY_RUN" = false ]; then
  rm -rf "$RESTORE_DIR"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Restore Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Source:     ${GREEN}$(basename "${BACKUP_FILE:-$FROM_S3}")${NC}"
echo -e "Components: ${GREEN}${DO_POSTGRES:+postgres }${DO_REDIS:+redis }${DO_ARCHIVE:+archive}${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warn "DRY RUN — no changes were made"
else
  log_success "System restored. Verify application functionality before serving traffic."
  echo ""
  echo -e "${YELLOW}Post-restore checklist:${NC}"
  echo "  1. Verify application health: curl http://localhost:3000/api/health"
  echo "  2. Check database connectivity: bun run db:check"
  echo "  3. Validate API responses: bun run test:api"
  echo "  4. Review logs for errors: bun run logs"
fi
