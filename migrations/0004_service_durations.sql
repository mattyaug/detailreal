CREATE TABLE IF NOT EXISTS service_durations (
  service_slug TEXT PRIMARY KEY,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 30 AND 720 AND duration_minutes % 15 = 0)
);
