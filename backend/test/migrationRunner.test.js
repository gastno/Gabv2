const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { applyMigrations, loadMigrationFiles } = require('../src/scripts/migrate');

test('migration runner applies ordered files once and records stable checksums', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gabv2-migrations-'));
  fs.writeFileSync(path.join(directory, '002_second.sql'), 'BEGIN;\nSELECT 2;\nCOMMIT;\n');
  fs.writeFileSync(path.join(directory, '001_first.sql'), 'SELECT 1;\n');
  const versions = new Map();
  const statements = [];
  const client = {
    query: async (sql, params = []) => {
      statements.push(sql.trim());
      if (sql.includes('SELECT checksum FROM schema_migrations')) {
        const checksum = versions.get(params[0]);
        return { rows: checksum ? [{ checksum }] : [] };
      }
      if (sql.includes('INSERT INTO schema_migrations')) {
        versions.set(params[0], params[1]);
      }
      return { rows: [] };
    },
  };
  const database = {
    query: async sql => {
      statements.push(sql.trim());
      return { rows: [] };
    },
    withTransaction: callback => callback(client),
  };

  try {
    assert.deepEqual(await applyMigrations(database, directory), ['001_first.sql', '002_second.sql']);
    assert.deepEqual(await applyMigrations(database, directory), []);
    assert.ok(statements.indexOf('SELECT 1;') < statements.indexOf('SELECT 2;'));
    assert.ok(!statements.includes('BEGIN;'));
    assert.ok(!statements.includes('COMMIT;'));
    assert.equal(loadMigrationFiles(directory).length, 2);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('migration runner rejects edits to a previously applied migration', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gabv2-migrations-'));
  const file = path.join(directory, '001_first.sql');
  fs.writeFileSync(file, 'SELECT 1;\n');
  const migration = loadMigrationFiles(directory)[0];
  fs.writeFileSync(file, 'SELECT 2;\n');
  const database = {
    query: async () => ({ rows: [] }),
    withTransaction: callback => callback({
      query: async (sql) => sql.includes('SELECT checksum FROM schema_migrations')
        ? { rows: [{ checksum: migration.checksum }] }
        : { rows: [] },
    }),
  };

  try {
    await assert.rejects(
      applyMigrations(database, directory),
      /has changed; create a new migration instead/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('migration runner recognizes the latest init.sql baseline without replaying legacy migrations', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gabv2-migrations-'));
  fs.writeFileSync(path.join(directory, '001_first.sql'), 'SELECT 1;\n');
  const versions = new Map();
  const statements = [];
  const database = {
    query: async sql => {
      statements.push(sql.trim());
      return { rows: [] };
    },
    withTransaction: callback => callback({
      query: async (sql, params = []) => {
        statements.push(sql.trim());
        if (sql.includes('SELECT version FROM schema_migrations')) return { rows: [] };
        if (sql.includes('is_current_baseline')) return { rows: [{ is_current_baseline: true }] };
        if (sql.includes('INSERT INTO schema_migrations')) versions.set(params[0], params[1]);
        return { rows: [] };
      },
    }),
  };

  try {
    assert.deepEqual(await applyMigrations(database, directory), []);
    assert.equal(versions.size, 1);
    assert.ok(!statements.includes('SELECT 1;'));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
