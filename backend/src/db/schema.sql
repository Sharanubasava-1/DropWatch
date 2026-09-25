CREATE TABLE IF NOT EXISTS raw_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  permalink TEXT,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL,
  model_key TEXT NOT NULL UNIQUE,
  summary TEXT,
  is_release INTEGER NOT NULL DEFAULT 1,
  confidence REAL,
  first_seen INTEGER,
  last_seen INTEGER,
  mention_count INTEGER DEFAULT 0,
  velocity REAL DEFAULT 0,
  top_url TEXT,
  top_source TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id INTEGER NOT NULL,
  taken_at INTEGER NOT NULL,
  mentions INTEGER,
  score_sum INTEGER,
  comments_sum INTEGER,
  FOREIGN KEY (release_id) REFERENCES releases(id)
);

CREATE INDEX IF NOT EXISTS idx_raw_created ON raw_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_snap_release ON snapshots(release_id, taken_at);
