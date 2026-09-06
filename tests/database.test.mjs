import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const initial = readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8');
const guards = readFileSync(new URL('../migrations/0002_booking_conflicts.sql', import.meta.url), 'utf8');
function database() { const db = new DatabaseSync(':memory:'); db.exec(initial); db.exec(guards); return db; }
function book(db, id, start = '10:00', end = '11:00', status = 'confirmed') {
  db.prepare(`INSERT INTO bookings (id,customer_name,email,phone,address,vehicle,service_slug,service_name,price_cents,duration_minutes,starts_at,ends_at,status)
  VALUES (?,'Test','test@example.com','1234567890','Test','Car','test','Test',100,60,?,?,?)`).run(id, `2030-01-01T${start}:00.000Z`, `2030-01-01T${end}:00.000Z`,status);
}
test('initial migration preserves existing hours and bookings on upgrade',()=>{
 const db=database(); book(db,'a'); db.exec("UPDATE availability SET is_enabled=0,start_time='09:00' WHERE weekday=0"); db.exec(initial);
 assert.equal(db.prepare('SELECT is_enabled FROM availability WHERE weekday=0').get().is_enabled,0);
 assert.equal(db.prepare('SELECT start_time FROM availability WHERE weekday=0').get().start_time,'09:00');
 assert.equal(db.prepare('SELECT count(*) AS n FROM bookings').get().n,1); db.close();
});
test('overlap rejected, adjacent bookings allowed',()=>{const db=database();book(db,'a');assert.throws(()=>book(db,'b','10:30','11:30'),/no_overlapping_active_bookings/);book(db,'c','11:00','12:00');db.close();});
test('cancellation frees slot but conflicting restore is rejected',()=>{const db=database();book(db,'a');db.exec("UPDATE bookings SET status='cancelled' WHERE id='a'");book(db,'b');assert.throws(()=>db.exec("UPDATE bookings SET status='confirmed' WHERE id='a'"),/no_overlapping_active_bookings/);assert.equal(db.prepare("SELECT status FROM bookings WHERE id='a'").get().status,'cancelled');db.close();});
test('rescheduling cannot overlap and completing same booking succeeds',()=>{const db=database();book(db,'a');book(db,'b','11:00','12:00');assert.throws(()=>db.exec("UPDATE bookings SET starts_at='2030-01-01T10:30:00.000Z' WHERE id='b'"),/no_overlapping_active_bookings/);db.exec("UPDATE bookings SET status='completed' WHERE id='a'");db.close();});
