-- Enforced inside SQLite/D1, including owner restores and direct SQL writes.
CREATE TRIGGER IF NOT EXISTS bookings_no_overlap_insert
BEFORE INSERT ON bookings
WHEN NEW.status <> 'cancelled'
BEGIN
  SELECT RAISE(ABORT, 'no_overlapping_active_bookings')
  WHERE EXISTS (
    SELECT 1 FROM bookings
    WHERE status <> 'cancelled'
      AND starts_at < NEW.ends_at AND ends_at > NEW.starts_at
  );
END;

CREATE TRIGGER IF NOT EXISTS bookings_no_overlap_update
BEFORE UPDATE OF starts_at, ends_at, status ON bookings
WHEN NEW.status <> 'cancelled'
BEGIN
  SELECT RAISE(ABORT, 'no_overlapping_active_bookings')
  WHERE EXISTS (
    SELECT 1 FROM bookings
    WHERE id <> OLD.id AND status <> 'cancelled'
      AND starts_at < NEW.ends_at AND ends_at > NEW.starts_at
  );
END;

CREATE INDEX IF NOT EXISTS bookings_active_interval_idx
ON bookings (starts_at, ends_at) WHERE status <> 'cancelled';
