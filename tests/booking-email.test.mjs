import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingMessages, sendBookingEmails } from '../lib/booking-email.ts';
const booking={id:'test-123',customerName:'Test Person',email:'customer@example.com',phone:'5551234567',address:'123 Test St',vehicle:'Test Car',serviceName:'Interior Detail',startsAt:'2030-07-01T15:00:00.000Z',durationMinutes:120,priceCents:15000,notes:'Access note'};
const config={apiKey:'test-key',from:'Bookings <bookings@example.com>'};
test('customer and owner get separate messages with Central time and appropriate replies',()=>{
 const m=bookingMessages(booking,config.from);
 assert.deepEqual(m.customer.to,['customer@example.com']);
 assert.deepEqual(m.owner.to,['matthewdaguinaldo@gmail.com']);
 assert.equal(m.customer.reply_to,'contact@nuecesdetail.com');
 assert.equal(m.owner.reply_to,'customer@example.com');
 assert.match(m.customer.text,/10:00 AM \(Central Time\)/);
 assert.doesNotMatch(m.owner.text,/Access note|5551234567|123 Test St|Test Car/);
 assert.doesNotMatch(m.customer.text,/123 Test St|Test Car/);
 assert.equal(m.customer.html,undefined);
});
test('two sends use different stable idempotency keys',async()=>{
 const calls=[];const result=await sendBookingEmails(booking,config,async(url,init)=>{calls.push(init);return new Response('{}',{status:200});});
 assert.deepEqual(result,{customer:true,owner:true});assert.equal(calls.length,2);
 assert.deepEqual(calls.map(c=>c.headers['Idempotency-Key']).sort(),['booking/test-123/customer','booking/test-123/owner']);
});
test('owner is still notified when customer is rejected',async()=>{
 const result=await sendBookingEmails(booking,config,async(url,init)=>new Response('{}',{status:JSON.parse(init.body).to[0]===booking.email?422:200}));
 assert.deepEqual(result,{customer:false,owner:true});
});
test('temporary failure retries with the same idempotency key',async()=>{
 const keys=[];let count=0;const result=await sendBookingEmails(booking,config,async(url,init)=>{if(JSON.parse(init.body).to[0]!==booking.email)return new Response('{}');keys.push(init.headers['Idempotency-Key']);return new Response('{}',{status:count++===0?503:200});});
 assert.equal(result.customer,true);assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
});
test('missing configuration sends nothing and does not throw',async()=>{
 const result=await sendBookingEmails(booking,{},async()=>{throw Error('must not call');});assert.deepEqual(result,{customer:false,owner:false});
});
