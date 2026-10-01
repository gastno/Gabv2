const test = require('node:test');
const assert = require('node:assert/strict');
const { BOOKING_TIME_ZONE, validateBookingRequest } = require('../src/services/bookingContract');

const validRequest = () => ({
  brand_id: 1,
  service_id: 2,
  staff_id: 3,
  full_name: 'Test Customer',
  phone_number: '+354 555 1234',
  kennitala: '010190-1234',
  start_time: '2026-10-01T10:00:00Z',
  consent_privacy: true,
});

test('booking contract uses the Iceland timezone', () => {
  assert.equal(BOOKING_TIME_ZONE, 'Europe/Reykjavik');
});

test('accepts a well-formed guest request and normalizes identity', () => {
  const result = validateBookingRequest(validRequest());

  assert.equal(result.error, undefined);
  assert.equal(result.value.kennitala, '010190-1234');
  assert.equal(result.value.startTime.toISOString(), '2026-10-01T10:00:00.000Z');
});

test('rejects missing or non-positive IDs', () => {
  for (const brand_id of [undefined, 0, -1, 'not-an-id']) {
    assert.ok(validateBookingRequest({ ...validRequest(), brand_id }).error);
  }
});

test('rejects false or missing privacy consent', () => {
  assert.match(validateBookingRequest({ ...validRequest(), consent_privacy: false }).error, /consent/i);
  const { consent_privacy, ...requestWithoutConsent } = validRequest();
  assert.match(validateBookingRequest(requestWithoutConsent).error, /consent/i);
});

test('rejects timestamps without offsets and invalid calendar dates', () => {
  for (const start_time of ['2026-10-01T10:00:00', '2026-02-30T10:00:00Z']) {
    assert.match(validateBookingRequest({ ...validRequest(), start_time }).error, /start_time/i);
  }
});

test('does not use client-supplied duration or price as authoritative values', () => {
  const result = validateBookingRequest({ ...validRequest(), duration_minutes: -20, price_isk: -1 });

  assert.equal(result.error, undefined);
  assert.equal('duration_minutes' in result.value, false);
  assert.equal('price_isk' in result.value, false);
});

test('accepts a registered customer identity without trusting guest profile fields', () => {
  const result = validateBookingRequest({
    brand_id: 1,
    service_id: 2,
    staff_id: 3,
    start_time: '2026-10-01T10:00:00Z',
    consent_privacy: true,
    kennitala: 'client-supplied-value-is-ignored',
  }, { id: 7, type: 'customer' });

  assert.equal(result.error, undefined);
  assert.equal(result.value.customerId, 7);
  assert.equal(result.value.kennitala, null);
  assert.equal(result.value.fullName, null);
});

test('rejects customer values longer than their database columns', () => {
  assert.match(validateBookingRequest({ ...validRequest(), full_name: 'x'.repeat(256) }).error, /full_name/i);
  assert.match(validateBookingRequest({ ...validRequest(), phone_number: '1'.repeat(51) }).error, /phone_number/i);
});