-- Social-to-SEO Tables Migration
-- Run this SQL to create the required tables for Social-to-SEO feature

-- Onboarding state per user
CREATE TABLE IF NOT EXISTS social_seo_onboarding (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  has_completed_onboarding INTEGER NOT NULL DEFAULT 0,
  current_step INTEGER NOT NULL DEFAULT 0,
  connected_platforms TEXT NOT NULL DEFAULT '[]',
  gsc_connected INTEGER NOT NULL DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_seo_onboarding_user ON social_seo_onboarding(user_id);

-- Dashboard cache with 24h TTL
CREATE TABLE IF NOT EXISTS social_seo_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, cache_key)
);

CREATE INDEX idx_social_seo_cache_lookup ON social_seo_cache(user_id, cache_key, expires_at);

-- Dismissed insights
CREATE TABLE IF NOT EXISTS social_seo_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  source_platform TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  is_dismissed INTEGER NOT NULL DEFAULT 0,
  dismissed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_seo_insights_user ON social_seo_insights(user_id, is_dismissed);

-- Grader scans for lead magnet
CREATE TABLE IF NOT EXISTS social_seo_grader_scans (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  impressions INTEGER NOT NULL,
  estimated_clicks INTEGER NOT NULL,
  platforms_detected TEXT NOT NULL,
  top_query_count INTEGER NOT NULL,
  opportunities_detected INTEGER NOT NULL,
  is_converted INTEGER NOT NULL DEFAULT 0,
  converted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_seo_grader_domain ON social_seo_grader_scans(domain);
CREATE INDEX idx_social_seo_grader_created ON social_seo_grader_scans(created_at);
