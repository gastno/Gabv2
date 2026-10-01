const test = require('node:test');
const assert = require('node:assert/strict');
const { BOOKING_TIME_ZONE, getAvailability, validateAvailabilityQuery } = require('../src/services/availabilityService');

test('validates an Iceland-local calendar date and optional staff filter', () => {
  assert.deepEqual(validateAvailabilityQuery({ service_id: '8', staff_id: '3', date: '2026-10-02' }), {
    value: { serviceId: 8, staffId: 3, date: '2026-10-02' },
  });
  assert.match(validateAvailabilityQuery({ service_id: '8', date: '2026-02-30' }).error, /valid calendar date/i);
  assert.equal(BOOKING_TIME_ZONE, 'Europe/Reykjavik');
});

test('queries slots against schedules, unavailability, service assignments, and active appointments', async () => {
  let queryText;
  let queryParams;
  const database = {
    async query(text, params) {
      queryText = text;
      queryParams = params;
      return { rows: [] };
    },
  };

  await getAvailability(database, { serviceId: 8, staffId: 3, date: '2026-10-02' });

  assert.deepEqual(queryParams, [8, '2026-10-02', 3]);
  assert.match(queryText, /staff_availabilities/);
  assert.match(queryText, /staff_unavailabilities/);
  assert.match(queryText, /staff_services/);
  assert.match(queryText, /appointments existing/);
  assert.match(queryText, /INTERVAL '15 minutes'/);
  assert.match(queryText, /Atlantic\/Reykjavik/);
  assert.match(queryText, /availability_date = \$2::date/);
});