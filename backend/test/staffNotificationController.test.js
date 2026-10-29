const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const controller = require('../src/controllers/staffNotificationController');

const originalQuery = db.query;
const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test.afterEach(() => { db.query = originalQuery; });

test('staff notification history is scoped to the authenticated staff account', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [{ id: 4, service_name: 'Lash lift', is_read: false, unread_count: 1 }] };
  };
  const res = response();
  await controller.listNotifications({ user: { id: '17', type: 'staff', role: 'staff' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(query.params, ['17']);
  assert.match(query.sql, /WHERE n\.staff_id = \$1/);
  assert.equal(res.body.unread_count, 1);
});

test('staff read updates are scoped, validated, and return the remaining unread count', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [{ read_ids: ['4'], unread_count: 0 }] };
  };
  const res = response();
  await controller.markNotificationsRead({
    user: { id: 17, type: 'staff', role: 'staff' },
    body: { notification_ids: [4] },
  }, res);

  assert.deepEqual(query.params, [17, [4]]);
  assert.match(query.sql, /staff_id = \$1 AND id = ANY\(\$2::bigint\[\]\)/);
  assert.deepEqual(res.body, { read_ids: ['4'], unread_count: 0 });

  let queryCount = 0;
  db.query = async () => { queryCount += 1; return { rows: [] }; };
  const invalid = response();
  await controller.markNotificationsRead({
    user: { id: 17, type: 'staff', role: 'staff' },
    body: { notification_ids: [0] },
  }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(queryCount, 0);

  const denied = response();
  await controller.listNotifications({ user: { id: 17, type: 'customer', role: 'customer' } }, denied);
  assert.equal(denied.statusCode, 403);
  assert.equal(queryCount, 0);
});
