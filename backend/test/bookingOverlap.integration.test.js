const { randomUUID } = require('node:crypto');
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

test('PostgreSQL excludes overlapping active bookings and permits adjacent boundaries', {
  skip: isTestDatabase ? false : 'Set BOOKING_TEST_DATABASE_URL to a disposable database whose name includes "test".',
}, async () => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: integrationUrl });
  const schemaName = `booking_test_${randomUUID().replace(/-/g, '')}`;
  const first = await pool.connect();
  const second = await pool.connect();

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    await pool.query(`CREATE SCHEMA "${schemaName}"`);
    await pool.query(`
      CREATE TABLE "${schemaName}".appointments (
        id BIGSERIAL PRIMARY KEY,
        staff_id BIGINT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL,
        EXCLUDE USING gist (
          staff_id WITH =,
          (tstzrange(start_time, end_time, '[)')) WITH &&
        ) WHERE (status IN ('pending', 'confirmed'))
      )
    `);

    const insert = `INSERT INTO "${schemaName}".appointments (staff_id, start_time, end_time, status)
      VALUES (1, $1, $2, 'confirmed')`;
    await first.query(insert, ['2026-10-01T10:00:00Z', '2026-10-01T11:00:00Z']);
    await assert.rejects(
      first.query(insert, ['2026-10-01T10:59:00Z', '2026-10-01T11:30:00Z']),
      error => error.code === '23P01'
    );
    await first.query(insert, ['2026-10-01T11:00:00Z', '2026-10-01T12:00:00Z']);

    await first.query('BEGIN');
    await first.query(insert, ['2026-10-01T13:00:00Z', '2026-10-01T14:00:00Z']);
    await second.query('BEGIN');
    const racingInsert = second.query(insert, ['2026-10-01T13:30:00Z', '2026-10-01T14:30:00Z']);
    await first.query('COMMIT');
    await assert.rejects(racingInsert, error => error.code === '23P01');
    await second.query('ROLLBACK');
  } finally {
    await first.query('ROLLBACK').catch(() => {});
    await second.query('ROLLBACK').catch(() => {});
    first.release();
    second.release();
    await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await pool.end();
  }
});