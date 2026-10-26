const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const { createApp } = require('../src/app');

const startTestServer = async database => {
  const app = createApp({
    database,
    config: { production: false, corsOrigins: [] },
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

test('liveness is independent of database readiness', async () => {
  const { server, baseUrl } = await startTestServer({
    query: async () => { throw new Error('database unavailable'); },
  });
  try {
    const response = await fetch(`${baseUrl}/health/live`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'OK');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('readiness reports database failures without exposing details', async () => {
  const { server, baseUrl } = await startTestServer({
    query: async () => { throw new Error('private database connection detail'); },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await fetch(`${baseUrl}/health/ready`);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.deepEqual(body, { status: 'NOT_READY' });
    assert.doesNotMatch(JSON.stringify(body), /private database/);
  } finally {
    console.error = originalError;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('readiness returns healthy only when the database responds', async () => {
  let statement;
  const { server, baseUrl } = await startTestServer({
    query: async sql => {
      statement = sql;
      return { rows: [{ '?column?': 1 }] };
    },
  });
  try {
    const response = await fetch(`${baseUrl}/health/ready`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'OK' });
    assert.equal(statement, 'SELECT 1');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
