export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Domain name: Measure. Table/column names keep legacy "metrics" / "metric_id".
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  archived_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS days (
  day_key TEXT PRIMARY KEY NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  note_updated_at INTEGER,
  tithi TEXT,
  vaar TEXT,
  paksha TEXT,
  nakshatra TEXT,
  masa TEXT,
  sunrise_iso TEXT,
  latitude REAL,
  longitude REAL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY NOT NULL,
  day_key TEXT NOT NULL,
  metric_id TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
  updated_at INTEGER NOT NULL,
  UNIQUE (day_key, metric_id),
  FOREIGN KEY (metric_id) REFERENCES metrics(id)
);

CREATE INDEX IF NOT EXISTS ratings_by_day ON ratings(day_key);
CREATE INDEX IF NOT EXISTS ratings_by_metric ON ratings(metric_id);
CREATE INDEX IF NOT EXISTS metrics_by_sort ON metrics(sort_order);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
