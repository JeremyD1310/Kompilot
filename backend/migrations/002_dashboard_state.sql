-- Dashboard state persisted per authenticated owner. Safe to re-run.
CREATE TABLE IF NOT EXISTS dashboard_action_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  resolution TEXT NOT NULL CHECK (resolution IN ('ignored', 'snoozed')),
  snoozed_until DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_action_owner
  ON dashboard_action_preferences(user_id, action_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_action_snooze
  ON dashboard_action_preferences(user_id, snoozed_until);

CREATE TABLE IF NOT EXISTS dashboard_milestone_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  establishment_id TEXT,
  milestone_type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_dashboard_milestone_pending
  ON dashboard_milestone_events(user_id, acknowledged_at, recorded_at);
