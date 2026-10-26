const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const controller = require('../src/controllers/notificationController');

const originalQuery = db.query;
const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test.afterEach(() => { db.query = originalQuery; });

test('notification preferences are readable and writable only by customer principals', async () => {
  let saved;
  db.query = async (_sql, params) => {
    saved = params;
    return { rows: [{ email_enabled: params[1] ?? false }] };
  };
  const res = response();
  await controller.updatePreferences({
    user: { id: 12, type: 'customer', role: 'customer' },
    body: { email_enabled: true },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved, [12, true]);
  assert.equal(res.body.preferences.email_enabled, true);

  const denied = response();
  await controller.getPreferences({
    user: { id: 12, type: 'staff', role: 'staff' },
  }, denied);
  assert.equal(denied.statusCode, 403);
});

test('preference writes reject non-boolean values without accessing the database', async () => {
  let queryCount = 0;
  db.query = async () => { queryCount += 1; return { rows: [] }; };
  const res = response();
  await controller.updatePreferences({
    user: { id: 12, type: 'customer', role: 'customer' },
    body: { email_enabled: 'true' },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(queryCount, 0);
});

test('notification history query is scoped to the authenticated customer', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [{ id: 2, delivery_status: 'failed', is_read: false, unread_count: 3 }] };
  };
  const res = response();
  await controller.listNotifications({
    user: { id: 12, type: 'customer', role: 'customer' },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(query.params, [12]);
  assert.match(query.sql, /WHERE n\.customer_id = \$1/);
  assert.equal(res.body.notifications[0].delivery_status, 'failed');
  assert.equal(res.body.notifications[0].is_read, false);
  assert.equal(res.body.unread_count, 3);
});

test('mark-read updates are scoped to the authenticated customer and return unread count', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [{ read_ids: ['22'], unread_count: 1 }] };
  };
  const res = response();
  await controller.markNotificationsRead({
    user: { id: 12, type: 'customer', role: 'customer' },
    body: { notification_ids: [22, 25] },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(query.params, [12, [22, 25]]);
  assert.match(query.sql, /customer_id = \$1 AND id = ANY\(\$2::bigint\[\]\)/);
  assert.deepEqual(res.body, { read_ids: ['22'], unread_count: 1 });
});

test('mark-all-read is customer-scoped and invalid requests fail before database access', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [{ read_ids: ['22'], unread_count: 0 }] };
  };
  const allResponse = response();
  await controller.markNotificationsRead({
    user: { id: 12, type: 'customer', role: 'customer' },
    body: { all: true },
  }, allResponse);
  assert.equal(allResponse.statusCode, 200);
  assert.deepEqual(query.params, [12]);
  assert.match(query.sql, /customer_id = \$1 AND is_read = FALSE/);

  let queryCount = 0;
  db.query = async () => { queryCount += 1; return { rows: [] }; };
  const invalidResponse = response();
  await controller.markNotificationsRead({
    user: { id: 12, type: 'customer', role: 'customer' },
    body: { notification_ids: [0, 'bad'] },
  }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(queryCount, 0);

  const deniedResponse = response();
  await controller.markNotificationsRead({
    user: { id: 12, type: 'staff', role: 'admin' },
    body: { all: true },
  }, deniedResponse);
  assert.equal(deniedResponse.statusCode, 403);
  assert.equal(queryCount, 0);
});

test('mark-read reports a clear server error when persistence fails', async () => {
  db.query = async () => { throw new Error('database unavailable'); };
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const res = response();
    await controller.markNotificationsRead({
      user: { id: 12, type: 'customer', role: 'customer' },
      body: { all: true },
    }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Failed to mark notifications as read.' });
  } finally {
    console.error = originalConsoleError;
  }
});
