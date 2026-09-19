-- Audit SEO/GEO du site professionnel. Safe to re-run; application manuelle uniquement.
CREATE TABLE IF NOT EXISTS website_visibility_audits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  requested_url TEXT NOT NULL,
  canonical_origin TEXT NOT NULL,
  scores_json TEXT NOT NULL DEFAULT '{}',
  methodology_json TEXT NOT NULL DEFAULT '{}',
  limitations_json TEXT NOT NULL DEFAULT '[]',
  page_count INTEGER NOT NULL DEFAULT 0,
  finding_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_website_audits_owner_created
  ON website_visibility_audits(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS website_visibility_pages (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  profile_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES website_visibility_audits(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_website_pages_owner_audit
  ON website_visibility_pages(user_id, audit_id);

CREATE TABLE IF NOT EXISTS website_visibility_findings (
  id TEXT NOT NULL,
  audit_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'content', 'local', 'trust', 'geo')),
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2')),
  page_url TEXT NOT NULL,
  title TEXT NOT NULL,
  evidence TEXT NOT NULL,
  impact TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  effort TEXT NOT NULL CHECK (effort IN ('faible', 'moyen', 'élevé')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'validated', 'ignored')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id, id),
  FOREIGN KEY (audit_id) REFERENCES website_visibility_audits(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_website_findings_owner_audit
  ON website_visibility_findings(user_id, audit_id, priority, status);
