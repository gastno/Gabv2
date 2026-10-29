const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const controller = require('../src/controllers/staffController');

const originalQuery = db.query;
const originalWithTransaction = db.withTransaction;

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test.afterEach(() => {
  db.query = originalQuery;
  db.withTransaction = originalWithTransaction;
});

test('staff directory returns active staff-role accounts only', async () => {
  let query;
  db.query = async sql => {
    query = sql;
    return { rows: [{ id: 8, role: 'staff' }] };
  };
  const res = response();

  await controller.getAllStaff({}, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ id: 8, role: 'staff' }]);
  assert.match(query, /r\.name = 'staff'/);
});

test('staff creation always assigns the staff role, regardless of submitted role_id', async () => {
  let insert;
  db.withTransaction = callback => callback({
    query: async (sql, params) => {
      if (/INSERT INTO staff \(/.test(sql)) {
        insert = { sql, params };
        return {
          rows: [{
            id: 9,
            role_id: 3,
            username: 'artist',
            full_name: 'Artist Name',
            email: null,
            description_en: null,
            description_is: null,
            avatar_url: null,
          }],
        };
      }
      return { rows: [] };
    },
  });
  const res = response();

  await controller.createStaff({
    body: {
      username: 'artist',
      password: 'a-test-password',
      full_name: 'Artist Name',
      role_id: 1,
      brand_ids: [2],
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.match(insert.sql, /FROM roles r\s+WHERE r\.name = 'staff'/);
  assert.equal(insert.params[0], 'artist');
  assert.equal(insert.params.includes(1), false);
  assert.equal(res.body.staff.role_id, 3);
});

test('staff updates cannot target admin accounts or change staff role', async () => {
  let lookup;
  db.query = async sql => {
    lookup = sql;
    return { rows: [] };
  };
  const adminRes = response();

  await controller.updateStaff({ params: { id: '1' }, body: { full_name: 'Admin' } }, adminRes);

  assert.equal(adminRes.statusCode, 404);
  assert.match(lookup, /r\.name = 'staff'/);

  let update;
  db.query = async () => ({
    rows: [{ id: 9, role_id: 3, avatar_url: null }],
  });
  db.withTransaction = callback => callback({
    query: async (sql, params) => {
      if (/UPDATE staff/.test(sql)) update = { sql, params };
      return { rows: [] };
    },
  });
  const staffRes = response();

  await controller.updateStaff({
    params: { id: '9' },
    body: { role_id: 1, full_name: 'Updated Artist' },
  }, staffRes);

  assert.equal(staffRes.statusCode, 200);
  const setClause = update.sql.match(/SET([\s\S]*?)WHERE/)[1];
  assert.doesNotMatch(setClause, /role_id\s*=/);
  assert.match(update.sql, /role_id = \(SELECT id FROM roles WHERE name = 'staff'\)/);
});
