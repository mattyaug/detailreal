import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { bookingListQuery, BOOKING_PAGE_SIZE } from '../lib/booking-list.ts';
import { overlapsBlockedHour, validBlockedHours } from '../lib/hour-blocks.ts';
import { SERVICES } from '../lib/services.ts';

test('hour blocks exclude partial overlaps and long services, but allow adjacent slots', () => {
  assert.equal(overlapsBlockedHour(8 * 60, 12 * 60, [10]), true);
  assert.equal(overlapsBlockedHour(9 * 60 + 30, 10 * 60 + 30, [10]), true);
  assert.equal(overlapsBlockedHour(10 * 60 + 30, 12 * 60, [10]), true);
  assert.equal(overlapsBlockedHour(8 * 60, 10 * 60, [10]), false);
  assert.equal(overlapsBlockedHour(11 * 60, 13 * 60, [10]), false);
  assert.equal(overlapsBlockedHour(8 * 60, 17 * 60, []), false);
  assert.equal(overlapsBlockedHour(13 * 60, 16 * 60, [10, 15]), true);
});

test('hour input rejects duplicates, strings, fractions and out-of-day hours', () => {
  for (const input of [null, {}, ['10'], [24], [-1], [10.5], [10, 10]]) assert.equal(validBlockedHours(input), false);
  assert.equal(validBlockedHours([]), true);
  assert.equal(validBlockedHours([0, 10, 23]), true);
});

test('new migration preserves hours and persists independent weekday blocks', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  db.exec("UPDATE availability SET start_time='09:30', is_enabled=0 WHERE weekday=1");
  const migration = readFileSync(new URL('../migrations/0003_weekly_blocked_hours.sql', import.meta.url), 'utf8');
  db.exec(migration);
  db.exec('INSERT INTO weekly_blocked_hours VALUES (1,10),(1,14),(2,10)');
  db.exec(migration);
  assert.equal(db.prepare('SELECT start_time FROM availability WHERE weekday=1').get().start_time, '09:30');
  assert.equal(db.prepare('SELECT is_enabled FROM availability WHERE weekday=1').get().is_enabled, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM weekly_blocked_hours').get().n, 3);
  assert.throws(() => db.exec('INSERT INTO weekly_blocked_hours VALUES (1,24)'));
  db.close();
});

test('archive includes every older record across pages and leaves only active bookings upcoming', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  const insert = db.prepare(`INSERT INTO bookings (id,customer_name,email,phone,address,vehicle,service_slug,service_name,price_cents,duration_minutes,starts_at,ends_at,status)
    VALUES (?,'Test','test@example.com','123','Test','Car','test','Test',100,60,?,?,?)`);
  for (let i = 0; i < 175; i++) insert.run(`old-${i}`, '2020-01-01T10:00:00.000Z', '2020-01-01T11:00:00.000Z', 'completed');
  insert.run('past-confirmed', '2029-01-01T10:00:00.000Z', '2029-01-01T11:00:00.000Z', 'confirmed');
  insert.run('cancelled', '2031-01-01T10:00:00.000Z', '2031-01-01T11:00:00.000Z', 'cancelled');
  insert.run('upcoming', '2031-01-01T10:00:00.000Z', '2031-01-01T11:00:00.000Z', 'confirmed');
  insert.run('ongoing', '2030-01-01T09:30:00.000Z', '2030-01-01T10:30:00.000Z', 'confirmed');
  insert.run('just-ended', '2030-01-01T09:00:00.000Z', '2030-01-01T10:00:00.000Z', 'confirmed');
  const fetch = (archive, offset) => { const { sql, params } = bookingListQuery(archive, offset, '2030-01-01T10:00:00.000Z'); return db.prepare(sql).all(...params); };
  assert.deepEqual(fetch(false, 0).map(row => row.id), ['ongoing', 'upcoming']);
  const ids = [];
  for (let offset = 0; ; offset += BOOKING_PAGE_SIZE) {
    const rows = fetch(true, offset);
    ids.push(...rows.slice(0, BOOKING_PAGE_SIZE).map(row => row.id));
    if (rows.length <= BOOKING_PAGE_SIZE) break;
  }
  assert.equal(ids.length, 178);
  assert.equal(new Set(ids).size, 178);
  assert.equal(ids[0], 'cancelled');
  db.close();
});

test('package base prices match the current menu', () => {
  assert.deepEqual(SERVICES.map(service => service.startingPriceCents), [9900, 16900, 19900, 26900]);
});
