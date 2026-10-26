const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadConfig, parseOrigins, parsePoolSize, parsePort } = require('../src/config/environment');

const baseEnvironment = {
  DB_HOST: 'localhost',
  DB_NAME: 'gabv2',
  DB_USER: 'gabv2',
  DB_PASSWORD: 'local-database-password',
  JWT_SECRET: 'a'.repeat(48),
};

test('configuration validates required values and supplies safe local port defaults', () => {
  const config = loadConfig(baseEnvironment);
  assert.equal(config.port, 5000);
  assert.equal(config.db.port, 5432);
  assert.deepEqual(config.corsOrigins, []);
  assert.throws(() => loadConfig({ ...baseEnvironment, DB_PASSWORD: '' }), /DB_PASSWORD/);
  assert.throws(() => loadConfig({ ...baseEnvironment, JWT_SECRET: 'short' }), /JWT_SECRET/);
  assert.throws(() => loadConfig({ ...baseEnvironment, JWT_SECRET: 'replace-with-a-real-secret-value-123456' }), /JWT_SECRET/);
});

test('production requires HTTPS CORS origins and valid ports', () => {
  const production = {
    ...baseEnvironment,
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://gabv2.example,https://admin.example',
  };
  assert.deepEqual(loadConfig(production).corsOrigins, [
    'https://gabv2.example',
    'https://admin.example',
  ]);
  assert.throws(() => loadConfig({ ...production, CORS_ORIGINS: '' }), /CORS_ORIGINS is required/);
  assert.throws(() => loadConfig({ ...production, CORS_ORIGINS: 'http://gabv2.example' }), /HTTPS/);
  assert.throws(() => loadConfig({ ...baseEnvironment, PORT: '0' }), /PORT/);
  assert.throws(() => parsePort('65536', 'PORT', '5000'), /PORT/);
  assert.throws(() => parsePoolSize('101'), /DB_POOL_MAX/);
  assert.throws(() => parseOrigins('https://gabv2.example/path', true), /origins/);
});

test('configuration can load secrets from protected files without placing them in env values', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gabv2-config-'));
  const passwordFile = path.join(directory, 'database-password');
  const jwtFile = path.join(directory, 'jwt-secret');
  fs.writeFileSync(passwordFile, 'database-secret\n');
  fs.writeFileSync(jwtFile, `${'b'.repeat(48)}\n`);

  try {
    const config = loadConfig({
      ...baseEnvironment,
      DB_PASSWORD: undefined,
      DB_PASSWORD_FILE: passwordFile,
      JWT_SECRET: undefined,
      JWT_SECRET_FILE: jwtFile,
    });
    assert.equal(config.db.password, 'database-secret');
    assert.equal(config.jwtSecret, 'b'.repeat(48));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
