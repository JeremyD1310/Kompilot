-- Final launch hardening tables. Safe to re-run.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT NOT NULL DEFAULT '',
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_id ON stripe_webhook_events(id);

CREATE TABLE IF NOT EXISTS pilot_coupon_audits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  coupon_lookup_key TEXT NOT NULL,
  checkout_session_id TEXT,
  eligible INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_coupon_audit_user ON pilot_coupon_audits(user_id, coupon_lookup_key);

CREATE TABLE IF NOT EXISTS lead_score_events (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT '',
  model_provider TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  input_snapshot TEXT NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  intent_type TEXT NOT NULL DEFAULT 'general_discussion',
  key_signals TEXT NOT NULL DEFAULT '[]',
  reasoning TEXT NOT NULL DEFAULT '',
  recommended_action TEXT NOT NULL DEFAULT 'monitor',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_score_events_thread ON lead_score_events(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_score_events_user_version ON lead_score_events(user_id, scoring_version, confidence);

CREATE TABLE IF NOT EXISTS lead_score_outcomes (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  score_event_id TEXT,
  user_id TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'unreviewed',
  notes TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at DATETIME,
  conversion_event_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_score_outcomes_user ON lead_score_outcomes(user_id, outcome, created_at);

CREATE TABLE IF NOT EXISTS espion_analysis_feedback (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  actual_ad_status TEXT NOT NULL DEFAULT 'unreviewed',
  is_false_positive INTEGER NOT NULL DEFAULT 0,
  review_outcome TEXT NOT NULL DEFAULT 'unreviewed',
  review_reason TEXT NOT NULL DEFAULT '',
  scoring_version TEXT NOT NULL DEFAULT '',
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_espion_feedback_user ON espion_analysis_feedback(user_id, review_outcome, created_at);
