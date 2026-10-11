-- Dasara Zone Database Schema for Cloudflare D1
-- Developed by Alpha

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participation (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(participant_id, game_id),
  FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_participation_participant ON participation(participant_id);
CREATE INDEX IF NOT EXISTS idx_participation_game ON participation(game_id);
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
