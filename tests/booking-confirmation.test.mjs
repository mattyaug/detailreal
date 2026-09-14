import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmationPath, confirmationCopy } from '../lib/booking-confirmation.ts';

test('successful email submission points to inbox guidance', () => {
  assert.equal(confirmationPath(true), '/book/confirmed?delivery=sent');
  assert.match(confirmationCopy('sent').title, /Check your inbox/);
  assert.match(confirmationCopy('sent').next, /spam or junk/);
});
test('email failure preserves booking and explains how to get confirmation', () => {
  assert.equal(confirmationPath(false), '/book/confirmed?delivery=failed');
  assert.match(confirmationCopy('failed').message, /appointment is saved/);
  assert.match(confirmationCopy('failed').message, /couldn't send/);
  assert.match(confirmationCopy('failed').next, /do not need to book again/);
});
test('direct visits do not claim an appointment was saved', () => {
  for (const value of [undefined, '', 'unknown']) assert.match(confirmationCopy(value).message, /If you've already booked/);
});
