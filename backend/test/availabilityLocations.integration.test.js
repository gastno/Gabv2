const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const integrationUrl = process.env.BOOKING_TEST_DATABASE_URL;
let isTestDatabase = false;
if (integrationUrl) {
  try {
    isTestDatabase = /(?:^|[_-])test(?:[_-]|$)/i.test(new URL(integrationUrl).pathname.slice(1));
  } catch (error) {
    isTestDatabase = false;
  }
}

test('PostgreSQL persists locations, protects booked shifts, and backfills existing appointments', {
  skip: isTestDatabase ? false : 'Set BOOKING_TEST_DATABASE_URL to a disposable database whose name includes "test".',
}, async () => {
  const { Pool } = require('pg');
  const { createDatabase } = require('../src/config/db');
  const { getAvailability } = require('../src/services/availabilityService');
  const { createBooking } = require('../src/services/bookingService');
  const { normalizeAvailabilityShifts, replaceStaffAvailability } = require('../src/services/staffAvailabilityService');
  const schema = `locations_test_${randomUUID().replace(/-/g, '')}`;
  const admin = new Pool({ connectionString: integrationUrl });
  let pool;
  try {
    await admin.query('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    await admin.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await admin.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: integrationUrl, options: `-c search_path=${schema},public` });
    const database = createDatabase(pool);
    await database.query(fs.readFileSync(path.join(__dirname, '../../database/init.sql'), 'utf8'));
    await database.query(`
      INSERT INTO brands (id, name, slug, location) VALUES (1, 'Studio', 'studio', 'Main studio');
      INSERT INTO roles (id, name) VALUES (1, 'staff');
      INSERT INTO staff (id, role_id, username, password_hash, full_name) VALUES (1, 1, 'staff', 'hash', 'Staff');
      INSERT INTO staff_brands VALUES (1, 1);
      INSERT INTO categories (id, brand_id, name_en) VALUES (1, 1, 'Category');
      INSERT INTO services (id, brand_id, category_id, name_en, duration_minutes, price_isk)
        VALUES (1, 1, 1, 'Service', 60, 1000);
      INSERT INTO staff_services VALUES (1, 1);
      INSERT INTO customers (id, full_name, phone_number, kennitala, is_registered)
        VALUES (1, 'Customer', '555', '010190-1234', TRUE);
      ALTER TABLE appointments DROP COLUMN location, DROP COLUMN is_alternate_location;
      ALTER TABLE staff_availabilities DROP COLUMN location;
      INSERT INTO appointments (brand_id, service_id, staff_id, customer_id, start_time, end_time,
        duration_snapshot_minutes, price_snapshot_isk, status)
        VALUES (1, 1, 1, 1, '2020-01-01 10:00Z', '2020-01-01 11:00Z', 60, 1000, 'completed');
    `);
    await database.query(fs.readFileSync(path.join(__dirname, '../../database/migrations/012_availability_locations.sql'), 'utf8'));
    const old = await database.query('SELECT location, is_alternate_location FROM appointments');
    assert.deepEqual(old.rows, [{ location: 'Main studio', is_alternate_location: false }]);

    const dateResult = await database.query("SELECT ((NOW() AT TIME ZONE 'Atlantic/Reykjavik')::date + 2)::text AS date");
    const date = dateResult.rows[0].date;
    const shifts = location => normalizeAvailabilityShifts([{ start_time: '09:00', end_time: '17:00', location }]).value;
    await replaceStaffAvailability(database, 1, date, shifts('Other studio'));
    const available = await getAvailability(database, { serviceId: 1, staffId: 1, date });
    assert.ok(available.rows.length);
    assert.equal(available.rows[0].location, 'Other studio');
    assert.equal(available.rows[0].is_alternate_location, true);

    const booking = {
      brandId: 1, serviceId: 1, staffId: 1, customerId: 1,
      startTime: new Date(`${date}T10:00:00Z`), customOptions: null,
    };
    await assert.rejects(createBooking(database, booking), error => error.status === 409);
    const appointment = await createBooking(database, { ...booking, expectedLocation: 'Other studio' });
    assert.equal(appointment.location, 'Other studio');
    assert.equal(appointment.is_alternate_location, true);
    await replaceStaffAvailability(database, 1, date, shifts('Other studio'));
    await assert.rejects(replaceStaffAvailability(database, 1, date, shifts('New studio')),
      error => error.status === 409);
    const retained = await database.query('SELECT location FROM staff_availabilities');
    assert.equal(retained.rows[0].location, 'Other studio');
  } finally {
    if (pool) await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
