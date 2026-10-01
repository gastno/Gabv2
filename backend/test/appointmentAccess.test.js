const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransitionAppointment, isAppointmentAccessible } = require('../src/services/appointmentAccess');

const appointment = { customer_id: '8', staff_id: '3', brand_id: '2' };

test('appointment reads are limited by customer, assigned staff, and assigned admin brand', () => {
  assert.equal(isAppointmentAccessible({ id: 8, type: 'customer' }, appointment), true);
  assert.equal(isAppointmentAccessible({ id: 9, type: 'customer' }, appointment), false);
  assert.equal(isAppointmentAccessible({ id: 3, type: 'staff', role: 'staff' }, appointment), true);
  assert.equal(isAppointmentAccessible({ id: 4, type: 'staff', role: 'staff' }, appointment), false);
  assert.equal(isAppointmentAccessible({ id: 5, type: 'staff', role: 'admin' }, appointment, [2]), true);
  assert.equal(isAppointmentAccessible({ id: 5, type: 'staff', role: 'admin' }, appointment, [1]), false);
  assert.equal(isAppointmentAccessible({ id: 6, type: 'staff', role: 'super_admin' }, appointment), true);
});

test('appointment status transitions are explicit and terminal states cannot reopen', () => {
  assert.equal(canTransitionAppointment('pending', 'confirmed'), true);
  assert.equal(canTransitionAppointment('confirmed', 'completed'), true);
  assert.equal(canTransitionAppointment('confirmed', 'no_show'), true);
  assert.equal(canTransitionAppointment('pending', 'completed'), false);
  assert.equal(canTransitionAppointment('completed', 'confirmed'), false);
  assert.equal(canTransitionAppointment('cancelled', 'confirmed'), false);
});