-- Copyright 2024-2026 nirholas. All rights reserved.
-- SPDX-License-Identifier: SEE LICENSE IN LICENSE
-- https://github.com/nirholas/free-crypto-news
--
-- This file is part of free-crypto-news.
-- Unauthorized copying, modification, or distribution is strictly prohibited.

-- Migration: Add webhook, Telegram, and Discord delivery to alerts
-- Created: 2026-08-28
--
-- Before this migration `alerts.notification_channel` only ever held 'email',
-- 'push', or 'none', and nothing was actually delivered. The three new push
-- channels each need their own endpoint configuration, plus a record of the
-- last delivery attempt so a dead endpoint is visible in the UI instead of
-- failing silently every time the alert fires.
--
-- notification_channel is already VARCHAR(32), which fits 'telegram' and
-- 'discord', so no type change is needed. The CHECK constraint below is what
-- keeps the new vocabulary honest.

-- ── delivery endpoints ─────────────────────────────────────────────────────
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(256);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS telegram_bot_token VARCHAR(128);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64);

-- ── last delivery attempt ──────────────────────────────────────────────────
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_delivery_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_delivery_status INTEGER;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_delivery_error TEXT;

-- ── vocabulary ─────────────────────────────────────────────────────────────
-- Added NOT VALID so the migration never fails on a row written before the
-- constraint existed; validate it separately once the backlog is clean.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alerts_notification_channel_check'
  ) THEN
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_notification_channel_check
      CHECK (notification_channel IN ('email', 'push', 'webhook', 'telegram', 'discord', 'none'))
      NOT VALID;
  END IF;
END
$$;

-- ── indexes ────────────────────────────────────────────────────────────────
-- The delivery sweep selects active alerts by channel, so index the column it
-- filters on rather than scanning every alert on every tick.
CREATE INDEX IF NOT EXISTS idx_alerts_channel ON alerts (notification_channel);
CREATE INDEX IF NOT EXISTS idx_alerts_delivery_failures
  ON alerts (last_delivery_at DESC)
  WHERE last_delivery_error IS NOT NULL;
