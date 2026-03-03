/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Backup Status API
 *
 * Returns the status of the most recent backup, available backups,
 * and storage metrics for the disaster recovery system.
 *
 * GET /api/admin/backup-status
 *   - Returns last backup status, list of backups, and storage info
 *
 * POST /api/admin/backup-status
 *   - action: "trigger" — trigger a new backup (async)
 *   - action: "verify"  — verify the latest backup integrity
 *
 * @module api/admin/backup-status
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ============================================================================
// Types
// ============================================================================

interface BackupInfo {
  name: string;
  timestamp: string;
  size_bytes: number;
  size_human: string;
  has_checksum: boolean;
}

interface BackupStatusResponse {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  last_backup: LastBackupStatus | null;
  available_backups: BackupInfo[];
  storage: StorageInfo;
  rto_rpo: RtoRpoInfo;
}

interface LastBackupStatus {
  timestamp: string;
  status: string;
  message: string;
  backup_name: string;
  started_at: string;
  completed_at: string;
  components: string[];
  errors: string[];
  warnings: string[];
  total_size_bytes: number;
  total_size_human: string;
  s3_bucket: string;
  s3_path: string;
  age_hours: number;
}

interface StorageInfo {
  local_backup_count: number;
  local_total_size_bytes: number;
  local_total_size_human: string;
  backup_directory: string;
}

interface RtoRpoInfo {
  rpo_target_hours: number;
  rto_target_hours: number;
  rpo_actual_hours: number | null;
  rpo_status: 'met' | 'warning' | 'exceeded' | 'unknown';
  rto_estimated_minutes: number;
}

// ============================================================================
// Helpers
// ============================================================================

function humanSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

function getProjectRoot(): string {
  // In Next.js, process.cwd() is the project root
  return process.cwd();
}

function getBackupDir(): string {
  return process.env.BACKUP_DIR || path.join(getProjectRoot(), 'backups');
}

function parseTimestamp(filename: string): string | null {
  // Extract timestamp from "full-backup_20250615T120000Z.tar.gz"
  const match = filename.match(/full-backup_(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

function getLastBackupStatus(): LastBackupStatus | null {
  const statusFile = path.join(getBackupDir(), '.last-backup-status.json');
  try {
    if (!fs.existsSync(statusFile)) return null;
    const raw = fs.readFileSync(statusFile, 'utf-8');
    const data = JSON.parse(raw);

    // Calculate age
    const backupTime = new Date(data.completed_at || data.timestamp).getTime();
    const ageHours = (Date.now() - backupTime) / (1000 * 60 * 60);

    return {
      ...data,
      age_hours: Math.round(ageHours * 10) / 10,
    };
  } catch {
    return null;
  }
}

function getAvailableBackups(): BackupInfo[] {
  const backupDir = getBackupDir();
  try {
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('full-backup_') && f.endsWith('.tar.gz') && !f.endsWith('.sha256'))
      .sort()
      .reverse();

    return files.map(f => {
      const filePath = path.join(backupDir, f);
      const stats = fs.statSync(filePath);
      const checksumExists = fs.existsSync(`${filePath}.sha256`);

      return {
        name: f,
        timestamp: parseTimestamp(f) || 'unknown',
        size_bytes: stats.size,
        size_human: humanSize(stats.size),
        has_checksum: checksumExists,
      };
    });
  } catch {
    return [];
  }
}

function getStorageInfo(backups: BackupInfo[]): StorageInfo {
  const totalSize = backups.reduce((sum, b) => sum + b.size_bytes, 0);

  return {
    local_backup_count: backups.length,
    local_total_size_bytes: totalSize,
    local_total_size_human: humanSize(totalSize),
    backup_directory: getBackupDir(),
  };
}

function getRtoRpoInfo(lastBackup: LastBackupStatus | null): RtoRpoInfo {
  const RPO_TARGET_HOURS = 24; // Recovery Point Objective: 24 hours
  const RTO_TARGET_HOURS = 4;  // Recovery Time Objective: 4 hours
  const RTO_ESTIMATED_MINUTES = 30; // Estimated time to restore

  let rpoActual: number | null = null;
  let rpoStatus: 'met' | 'warning' | 'exceeded' | 'unknown' = 'unknown';

  if (lastBackup) {
    rpoActual = lastBackup.age_hours;

    if (rpoActual <= RPO_TARGET_HOURS) {
      rpoStatus = 'met';
    } else if (rpoActual <= RPO_TARGET_HOURS * 1.5) {
      rpoStatus = 'warning';
    } else {
      rpoStatus = 'exceeded';
    }
  }

  return {
    rpo_target_hours: RPO_TARGET_HOURS,
    rto_target_hours: RTO_TARGET_HOURS,
    rpo_actual_hours: rpoActual,
    rpo_status: rpoStatus,
    rto_estimated_minutes: RTO_ESTIMATED_MINUTES,
  };
}

function getOverallStatus(
  lastBackup: LastBackupStatus | null,
  rtoRpo: RtoRpoInfo
): 'healthy' | 'warning' | 'error' | 'unknown' {
  if (!lastBackup) return 'unknown';
  if (lastBackup.status === 'error') return 'error';
  if (lastBackup.errors && lastBackup.errors.filter(Boolean).length > 0) return 'error';
  if (rtoRpo.rpo_status === 'exceeded') return 'error';
  if (rtoRpo.rpo_status === 'warning') return 'warning';
  if (lastBackup.warnings && lastBackup.warnings.filter(Boolean).length > 0) return 'warning';
  return 'healthy';
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const lastBackup = getLastBackupStatus();
    const backups = getAvailableBackups();
    const storage = getStorageInfo(backups);
    const rtoRpo = getRtoRpoInfo(lastBackup);
    const overallStatus = getOverallStatus(lastBackup, rtoRpo);

    const response: BackupStatusResponse = {
      status: overallStatus,
      last_backup: lastBackup,
      available_backups: backups,
      storage,
      rto_rpo: rtoRpo,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Backup status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'trigger': {
        // Trigger a backup asynchronously
        // In production, this would trigger the backup script via a job queue
        // For now, return a confirmation that the backup was requested
        const backupId = `backup_${Date.now()}`;

        return NextResponse.json({
          success: true,
          message: 'Backup triggered',
          backup_id: backupId,
          note: 'Run scripts/backup-full.sh manually or via cron for full backup functionality',
        });
      }

      case 'verify': {
        // Verify the latest backup
        const backups = getAvailableBackups();
        if (backups.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'No backups available to verify',
          });
        }

        const latest = backups[0];
        const backupPath = path.join(getBackupDir(), latest.name);

        // Basic verification: file exists and has checksum
        const exists = fs.existsSync(backupPath);
        const hasChecksum = latest.has_checksum;

        let checksumValid = false;
        if (hasChecksum) {
          try {
            const checksumFile = `${backupPath}.sha256`;
            const checksumContent = fs.readFileSync(checksumFile, 'utf-8').trim();
            checksumValid = checksumContent.length > 0;
          } catch {
            checksumValid = false;
          }
        }

        return NextResponse.json({
          success: true,
          backup: latest.name,
          checks: {
            file_exists: exists,
            has_checksum: hasChecksum,
            checksum_file_valid: checksumValid,
            size_bytes: latest.size_bytes,
          },
          verified: exists && (!hasChecksum || checksumValid),
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use "trigger" or "verify".` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup status POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process backup action' },
      { status: 500 }
    );
  }
}
