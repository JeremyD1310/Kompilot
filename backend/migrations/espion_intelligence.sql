-- Espion publicitaire intelligence layer. Applied through Blink SQL tooling.
CREATE TABLE IF NOT EXISTS espion_scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'other',
  target_url TEXT NOT NULL DEFAULT '',
  advertiser_name TEXT NOT NULL DEFAULT '',
  ad_name TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  retryable INTEGER NOT NULL DEFAULT 1,
  source_statuses TEXT NOT NULL DEFAULT '{}',
  error_code TEXT,
  error_message TEXT,
  input_payload TEXT NOT NULL DEFAULT '{}',
  result_json TEXT,
  started_at TEXT,
  heartbeat_at TEXT,
  completed_at TEXT,
  next_retry_at TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_espion_scans_user_status ON espion_scans(user_id, status, created_at);

CREATE TABLE IF NOT EXISTS espion_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'other',
  advertiser_name TEXT NOT NULL DEFAULT '',
  ad_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  creative_type TEXT NOT NULL DEFAULT 'unknown',
  description TEXT NOT NULL DEFAULT '',
  overall_score INTEGER NOT NULL DEFAULT 0,
  maturity_score INTEGER NOT NULL DEFAULT 0,
  analysis_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_espion_analyses_user_created ON espion_analyses(user_id, created_at);

CREATE TABLE IF NOT EXISTS espion_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#0D9488',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_espion_folders_user_name ON espion_folders(user_id, name);

CREATE TABLE IF NOT EXISTS espion_swipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  folder_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_espion_swipes_user_analysis ON espion_swipes(user_id, analysis_id);
CREATE INDEX IF NOT EXISTS idx_espion_swipes_user_folder ON espion_swipes(user_id, folder_id, created_at);

CREATE TABLE IF NOT EXISTS espion_benchmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'all',
  vertical TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  sample_size INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'user_library',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_espion_benchmarks_user ON espion_benchmarks(user_id, platform, vertical);

CREATE TABLE IF NOT EXISTS espion_comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  author_email TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  mentions TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_espion_comments_analysis ON espion_comments(analysis_id, created_at);

CREATE TABLE IF NOT EXISTS espion_shares (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  shared_with_user_id TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'comment',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_espion_shares_analysis_user ON espion_shares(analysis_id, shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_espion_shares_recipient ON espion_shares(shared_with_user_id, created_at);
