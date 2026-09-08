import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { isFutureBookingDate, bookableDates } from '../lib/booking-dates.ts';

test('same-day and past dates are blocked; tomorrow is bookable', () => {
  const now = DateTime.fromISO('2026-09-08T08:00:00-05:00');
  for (const date of ['2026-09-07', '2026-09-08', '2026-02-30', 'bad', '2026-09-09T08:00:00']) {
    assert.equal(isFutureBookingDate(date, now), false, date);
  }
  assert.equal(isFutureBookingDate('2026-09-09', now), true);
});

test('uses the Central calendar day even when UTC is already tomorrow', () => {
  const now = DateTime.fromISO('2026-09-09T04:59:59Z');
  assert.equal(isFutureBookingDate('2026-09-08', now), false);
  assert.equal(isFutureBookingDate('2026-09-09', now), true);
  assert.equal(bookableDates(now)[0].value, '2026-09-09');
  const midnight = now.plus({ seconds: 1 });
  assert.equal(isFutureBookingDate('2026-09-09', midnight), false);
  assert.equal(bookableDates(midnight)[0].value, '2026-09-10');
});

test('date menu starts tomorrow across DST, month, and year boundaries', () => {
  for (const [now, tomorrow] of [
    ['2026-03-07T23:30:00-06:00', '2026-03-08'],
    ['2026-10-31T23:30:00-05:00', '2026-11-01'],
    ['2026-12-31T23:30:00-06:00', '2027-01-01'],
  ]) {
    const clock = DateTime.fromISO(now);
    const dates = bookableDates(clock);
    assert.equal(dates[0].value, tomorrow);
    assert.match(dates[0].label, /^Tomorrow/);
    assert.equal(dates.length, 90);
    assert.equal(new Set(dates.map(day => day.value)).size, 90);
    assert.ok(dates.every(day => isFutureBookingDate(day.value, clock)));
  }
});
