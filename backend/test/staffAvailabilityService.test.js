const test = require('node:test');
const assert = require('node:assert/strict');
const {
  addStaffUnavailability,
  isValidLocalDate,
  isStaffInAdminScope,
  normalizeAvailabilityShifts,
  replaceStaffAvailability,
  validateUnavailablePeriod,
} = require('../src/services/staffAvailabilityService');
const { BookingError } = require('../src/services/bookingService');

test('normalizes shifts for one explicit date and allows adjacent periods', () => {
  const result = normalizeAvailabilityShifts([
    { start_time: '09:00', end_time: '12:00' },
    { start_time: '12:00', end_time: '17:00', is_active: false },
  ]);

  assert.equal(result.error, undefined);
  assert.deepEqual(result.value.map(shift => [shift.startTime, shift.endTime, shift.isActive]), [
    ['09:00:00', '12:00:00', true],
    ['12:00:00', '17:00:00', false],
  ]);
});

test('validates explicit dates and rejects overlapping shifts for that date', () => {
  assert.equal(isValidLocalDate('2026-10-01'), true);
  assert.equal(isValidLocalDate('2026-02-30'), false);
  assert.match(normalizeAvailabilityShifts([
    { start_time: '09:00', end_time: '13:00' },
    { start_time: '12:00', end_time: '17:00' },
  ]).error, /selected date.*overlap/i);
});

test('requires explicit-offset timestamps for one-off unavailability', () => {
  const valid = validateUnavailablePeriod({
    start_time: '2026-10-05T09:00:00Z',
    end_time: '2026-10-05T12:00:00Z',
    reason: 'Personal leave',
  });
  assert.equal(valid.error, undefined);
  assert.match(validateUnavailablePeriod({ start_time: '2026-10-05T09:00:00', end_time: '2026-10-05T12:00:00Z' }).error, /timezone offsets/i);
  assert.match(validateUnavailablePeriod({ start_time: '2026-10-05T12:00:00Z', end_time: '2026-10-05T09:00:00Z' }).error, /after/i);
});

test('replaces availability for only the requested date in one transaction', async () => {
  const statements = [];
  const client = {
    async query(text, params) {
      statements.push({ text, params });
      if (text.includes('SELECT id FROM staff')) return { rows: [{ id: 3 }] };
      if (text.includes('FROM appointments')) return { rows: [] };
      if (text.includes('FROM staff_availabilities')) return { rows: [] };
      if (text.includes('SELECT id, block_start')) return { rows: [] };
      return { rows: [] };
    },
  };
  const database = { async withTransaction(callback) { return callback(client); } };
  const shifts = normalizeAvailabilityShifts([{ start_time: '09:00', end_time: '17:00' }]).value;

  await replaceStaffAvailability(database, 3, '2026-10-05', shifts);

  assert.match(statements[1].text, /pg_advisory_xact_lock/);
  assert.ok(statements.some(statement => statement.text.includes('DELETE FROM staff_availabilities')));
  assert.ok(statements.some(statement => statement.text.includes('INSERT INTO staff_availabilities')));
  assert.ok(statements.some(statement => statement.params.includes('2026-10-05')));
});

test('does not remove availability that contains a booked appointment', async () => {
  let deleted = false;
  const database = {
    async withTransaction(callback) {
      return callback({
        async query(text) {
          if (text.includes('SELECT id FROM staff')) return { rows: [{ id: 3 }] };
          if (text.includes('FROM appointments')) return { rows: [{ id: 21 }] };
          if (text.includes('DELETE FROM staff_availabilities')) deleted = true;
          return { rows: [] };
        },
      });
    },
  };

  await assert.rejects(replaceStaffAvailability(database, 3, '2026-10-05', []), error => error.status === 409);
  assert.equal(deleted, false);
});

test('rejects unavailable periods that conflict with an active appointment', async () => {
  let inserted = false;
  const database = {
    async withTransaction(callback) {
      return callback({
        async query(text) {
          if (text.includes('SELECT id FROM staff')) return { rows: [{ id: 3 }] };
          if (text.includes('FROM appointments')) return { rows: [{ '?column?': 1 }] };
          if (text.includes('INSERT INTO staff_unavailabilities')) inserted = true;
          return { rows: [] };
        },
      });
    },
  };

  await assert.rejects(addStaffUnavailability(database, 3, {
    startTime: new Date('2026-10-05T09:00:00Z'),
    endTime: new Date('2026-10-05T12:00:00Z'),
    reason: null,
  }), error => error instanceof BookingError && error.status === 409);
  assert.equal(inserted, false);
});

test('admin schedule reads scope both the requested staff and the requesting admin brand', async () => {
  let params;
  let queryText;
  const database = {
    async query(text, values) {
      queryText = text;
      params = values;
      return { rows: [] };
    },
  };

  const accessible = await isStaffInAdminScope(database, 12, 4, { id: 9, role: 'admin' });

  assert.equal(accessible, false);
  assert.deepEqual(params, [12, 4, 9, false]);
  assert.match(queryText, /admin_scope\.staff_id = \$3/);
});