-- ============================================================
-- KOMPilot Add-on System — Migration SQL
-- ============================================================
-- Compatible SQLite (Turso/Blink DB). No PostgreSQL-specific syntax.
--
-- Run via: blink_run_sql with the CREATE TABLE statement below.
-- ============================================================

-- ── Table: user_addons (audit trail + active state) ──────────────────────────
CREATE TABLE IF NOT EXISTS user_addons (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  addon_id            TEXT NOT NULL,          -- 'creative_premium' | 'white_label'
  stripe_item_id      TEXT NOT NULL DEFAULT '', -- Stripe subscription item ID
  stripe_price_id     TEXT NOT NULL DEFAULT '', -- Stripe price ID for this addon
  status              TEXT NOT NULL DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due'
  activated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at        DATETIME,
  current_period_end  TEXT,                    -- ISO date when current billing period ends
  metadata            TEXT NOT NULL DEFAULT '{}', -- JSON: arbitrary addon config
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_addons_user   ON user_addons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_status ON user_addons(user_id, status);

-- ── Metadata schema (stored in users.metadata JSON) ──────────────────────────
-- The following keys are added/managed by addonHelpers.ts:
--
--   addons: {
--     creative_premium: { active: boolean, stripe_item_id: string, activated_at: string },
--     white_label:      { active: boolean, stripe_item_id: string, activated_at: string }
--   }
--
-- This is the fast-read path (no extra DB query).
-- user_addons table is the authoritative audit trail.

-- ── Stripe Price ID env vars to add in Blink backend secrets ─────────────────
--   PRICE_ADDON_CREATIVE_PREMIUM_MONTHLY_ID  → price_xxx  (39€ HT/mois)
--   PRICE_ADDON_WHITE_LABEL_MONTHLY_ID       → price_xxx  (49€ HT/mois)
