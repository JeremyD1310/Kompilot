-- Collecte manuelle des signalements de scores GEO/AIO.
-- À appliquer uniquement après validation humaine dans le workspace Blink.
CREATE TABLE IF NOT EXISTS geo_score_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  audit_type TEXT NOT NULL DEFAULT 'citation_audit',
  score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  brand_name TEXT NOT NULL DEFAULT '',
  site_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geo_score_feedback_user_created
  ON geo_score_feedback(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_geo_score_feedback_status
  ON geo_score_feedback(status, created_at);
