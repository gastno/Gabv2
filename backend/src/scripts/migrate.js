const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ADVISORY_LOCK_NAMESPACE = 724031;
const ADVISORY_LOCK_ID = 1;

const loadMigrationFiles = (directory) => fs.readdirSync(directory)
  .filter(file => /^\d{3}_[a-z0-9_]+\.sql$/i.test(file))
  .sort()
  .map(file => {
    const sql = fs.readFileSync(path.join(directory, file), 'utf8').replace(/\r\n/g, '\n');
    return {
      version: file,
      checksum: crypto.createHash('sha256').update(sql).digest('hex'),
      sql: sql
        .replace(/^\s*BEGIN\s*;\s*/i, '')
        .replace(/\s*COMMIT\s*;\s*$/i, ''),
    };
  });

const applyMigrations = async (database, directory = path.join(__dirname, '../../../database/migrations')) => {
  const migrations = loadMigrationFiles(directory);
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const isCurrentBaseline = await database.withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [
      ADVISORY_LOCK_NAMESPACE,
      ADVISORY_LOCK_ID,
    ]);
    const recorded = await client.query('SELECT version FROM schema_migrations LIMIT 1');
    if (recorded.rows.length) return false;

    const result = await client.query(`
      SELECT
        to_regclass('public.staff_availabilities') IS NOT NULL
          AND to_regclass('public.staff_schedules') IS NULL
          AND EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'appointments_active_no_overlap'
          )
          AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'appointment_notifications'
              AND column_name = 'is_read'
          ) AS is_current_baseline,
        to_regclass('public.staff_appointment_notifications') IS NOT NULL
          AS has_staff_appointment_notifications
    `);
    if (!result.rows[0]?.is_current_baseline) return false;

    const hasStaffNotifications = result.rows[0].has_staff_appointment_notifications ?? true;
    const baselineMigrations = hasStaffNotifications
      ? migrations
      : migrations.filter(migration => migration.version < '011_staff_booking_notifications.sql');
    for (const migration of baselineMigrations) {
      await client.query(
        'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
        [migration.version, migration.checksum]
      );
    }
    return hasStaffNotifications ? 'current' : 'legacy';
  });
  if (isCurrentBaseline === 'current') return [];

  const applied = [];
  for (const migration of migrations) {
    const wasApplied = await database.withTransaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock($1, $2)', [
        ADVISORY_LOCK_NAMESPACE,
        ADVISORY_LOCK_ID,
      ]);
      const existing = await client.query(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [migration.version]
      );
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== migration.checksum) {
          throw new Error(`Applied migration ${migration.version} has changed; create a new migration instead.`);
        }
        return false;
      }

      await client.query(migration.sql);
      await client.query(
        'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
        [migration.version, migration.checksum]
      );
      return true;
    });
    if (wasApplied) applied.push(migration.version);
  }
  return applied;
};

const run = async () => {
  require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
  require('dotenv').config();
  const { readSecret } = require('../config/environment');
  let databasePassword;
  try {
    databasePassword = readSecret(process.env, 'DB_PASSWORD');
  } catch (error) {
    console.error('Database migration configuration failed:', error.message);
    process.exitCode = 1;
    return;
  }
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !databasePassword) {
    console.error('Database migration configuration failed: DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD are required.');
    process.exitCode = 1;
    return;
  }
  process.env.DB_PASSWORD = databasePassword;

  const database = require('../config/db');
  try {
    const applied = await applyMigrations(database);
    console.log(`Database migration check complete (${applied.length} new).`);
  } catch (error) {
    console.error('Database migrations failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await database.end();
    } catch (error) {
      console.error('Database connection shutdown failed:', error.message);
      process.exitCode = 1;
    }
  }
};

if (require.main === module) void run();

module.exports = { applyMigrations, loadMigrationFiles };
