CREATE TABLE IF NOT EXISTS weekly_blocked_hours (
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  PRIMARY KEY (weekday, hour)
);
