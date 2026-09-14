CREATE TABLE IF NOT EXISTS catalog_settings (
  slug TEXT PRIMARY KEY,
  prices_json TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);

