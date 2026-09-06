CREATE TABLE IF NOT EXISTS availability (
  weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '17:00',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO availability (weekday, start_time, end_time, is_enabled)
VALUES
  (0, '08:00', '17:00', 1),
  (1, '08:00', '17:00', 1),
  (2, '08:00', '17:00', 1),
  (3, '08:00', '17:00', 1),
  (4, '08:00', '17:00', 1),
  (5, '08:00', '17:00', 1),
  (6, '08:00', '17:00', 1)
ON CONFLICT (weekday) DO NOTHING;

CREATE TABLE IF NOT EXISTS blocked_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocked_date TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Portland',
  vehicle TEXT NOT NULL,
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
