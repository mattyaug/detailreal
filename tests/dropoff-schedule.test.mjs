import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { DateTime } = require('luxon');
const source = ts.transpileModule(readFileSync(new URL('../lib/schedule.ts', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function schedule(bookings=[],blocked=[]) {
  const module={exports:{}};
  const query=async sql=>({rows:sql.includes('FROM availability')?[{weekday:2,start_time:'08:00',end_time:'17:00',is_enabled:1}]:sql.includes('FROM weekly_blocked_hours')?blocked.map(hour=>({hour})):sql.includes('FROM bookings')?bookings:[],rowCount:0});
  new Function('require','module','exports',source)(name=> name==='@/lib/db'?{query}:name==='@/lib/booking-dates'?{BUSINESS_TIME_ZONE:'America/Chicago',isFutureBookingDate:()=>true}:name==='@/lib/hour-blocks'?require('../lib/hour-blocks.ts'):require(name),module,module.exports);
  return module.exports.getAvailableSlots;
}
const day='2030-06-04';
test('ceramic drop-off can start in business hours despite overnight curing',async()=>{
  assert.equal((await schedule()(day,2880)).length,0);
  const slots=await schedule()(day,2880,true);
  assert.equal(slots.length,18);
  assert.equal(slots[0].label,'8:00 AM');assert.equal(slots.at(-1).label,'4:30 PM');
});
test('a booking on the following day prevents overlapping coating drop-offs',async()=>{
  const start=DateTime.fromISO('2030-06-05T10:00',{zone:'America/Chicago'});
  assert.equal((await schedule([{starts_at:start.toUTC().toISO(),ends_at:start.plus({hours:2}).toUTC().toISO()}])(day,2880,true)).length,0);
});
test('blocked intake hours remain unavailable for drop-off',async()=>{
  const slots=await schedule([],[8])(day,2880,true);
  assert.equal(slots[0].label,'9:00 AM');assert.equal(slots.length,16);
});

