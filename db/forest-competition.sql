-- Run against a dedicated PostgreSQL database before enabling competitions.
-- Never expose the database URL or write credentials to the browser.
CREATE TABLE IF NOT EXISTS forest_players (
  wallet TEXT PRIMARY KEY CHECK (wallet ~ '^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$'),
  username VARCHAR(20) NOT NULL UNIQUE CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS forest_seasons (
  id BIGSERIAL PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL UNIQUE,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','review','finalized')),
  CHECK (ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS forest_runs (
  id UUID PRIMARY KEY,
  wallet TEXT NOT NULL REFERENCES forest_players(wallet),
  season_id BIGINT NOT NULL REFERENCES forest_seasons(id),
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100000),
  duration_ms INTEGER NOT NULL CHECK (duration_ms BETWEEN 1000 AND 7200000),
  completed BOOLEAN NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forest_runs_season_verified ON forest_runs(season_id,wallet) WHERE verification_status='verified';
CREATE INDEX IF NOT EXISTS forest_runs_wallet ON forest_runs(wallet);
-- No direct public INSERT policy or score-submission API until signed wallet authentication
-- AND authoritative anti-cheat verification are implemented and tested.
