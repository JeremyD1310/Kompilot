CREATE TABLE IF NOT EXISTS establishments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  activity TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  ai_credits_limit INTEGER NOT NULL DEFAULT 50,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  booking_url TEXT,
  siret TEXT,
  google_maps_url TEXT,
  legal_address TEXT,
  postal_code TEXT,
  activity_code TEXT,
  activity_label TEXT,
  legal_form TEXT,
  verification_source TEXT,
  verified_at TEXT,
  pappers_data_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_establishments_user_id
ON establishments(user_id);

CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_id
ON onboarding_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_objective
ON onboarding_profiles(user_id, objective);
