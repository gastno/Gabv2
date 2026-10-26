const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const serviceController = require('../src/controllers/serviceController');

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

test('public catalog filters inactive services while staff and admins can inspect them', async () => {
  const requests = [];
  db.query = async (sql, params) => {
    requests.push({ sql, params });
    return { rows: [] };
  };
  db.withTransaction = callback => callback({ query: db.query });
  const publicResponse = response();
  await serviceController.getAllServices({ user: undefined }, publicResponse);
  const staffResponse = response();
  await serviceController.getAllServices({
    user: { id: 9, type: 'staff', role: 'staff' },
  }, staffResponse);

  assert.deepEqual(requests.map(({ params }) => params), [[false], [true]]);
  assert.ok(requests.every(({ sql }) => sql.includes('s.sale_price_isk')));
  assert.ok(requests.every(({ sql }) => sql.includes('s.is_active = TRUE')));
});

test('service creation validates discount and only writes after brand/category authorization', async () => {
  const statements = [];
  let poolQueries = 0;
  db.query = async () => {
    poolQueries += 1;
    throw new Error('Service mutations must use their transaction client.');
  };
  db.withTransaction = callback => callback({ query: async (sql, params) => {
    statements.push({ sql, params });
    if (sql.includes('FROM categories WHERE id = $1')) return { rows: [{ id: 4 }] };
    return { rows: [{
      id: 6, brand_id: 2, category_id: 4, price_isk: '12000',
      sale_price_isk: '9000', is_active: true,
    }] };
  } });
  const req = {
    user: { id: 1, type: 'staff', role: 'super_admin' },
    body: {
      brand_id: 2,
      category_id: 4,
      name: 'Lash lift',
      duration_minutes: 45,
      price_isk: 12000,
      sale_price_isk: 9000,
      is_active: true,
    },
  };
  const res = response();
  await serviceController.createService(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(poolQueries, 0);
  const insert = statements.find(({ sql }) => sql.includes('INSERT INTO services'));
  assert.deepEqual(insert.params.slice(7), [12000, 9000, null, true]);

  const invalidResponse = response();
  await serviceController.createService({
    ...req,
    body: { ...req.body, sale_price_isk: 12000 },
  }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 400);
});

test('service prices accept formatted catalog amounts and reject negative or malformed amounts', async () => {
  let transactions = 0;
  db.query = async () => ({ rows: [] });
  db.withTransaction = async callback => {
    transactions += 1;
    return callback({ query: async () => ({ rows: [] }) });
  };

  const baseRequest = {
    user: { id: 1, type: 'staff', role: 'super_admin' },
    body: {
      brand_id: 2,
      category_id: 4,
      name: 'Lash lift',
      duration_minutes: 45,
      price: '12,000 kr',
    },
  };

  const invalidAmounts = ['-12000', '12oops', '12.345', '1,2,000'];
  for (const amount of invalidAmounts) {
    const res = response();
    await serviceController.createService({
      ...baseRequest,
      body: { ...baseRequest.body, price: amount },
    }, res);
    assert.equal(res.statusCode, 400, `expected ${amount} to be rejected`);
  }

  assert.equal(transactions, 0);
});

test('service mutations reject admins assigned to a different brand', async () => {
  let writes = 0;
  db.query = async () => {
    throw new Error('Service mutations must use their transaction client.');
  };
  db.withTransaction = callback => callback({ query: async sql => {
    if (sql.includes('FROM staff_brands')) return { rows: [] };
    writes += 1;
    return { rows: [] };
  } });
  const res = response();
  await serviceController.createService({
    user: { id: 99, type: 'staff', role: 'admin' },
    body: {
      brand_id: 2,
      category_id: 4,
      name: 'Lash lift',
      duration_minutes: 45,
      price_isk: 12000,
    },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(writes, 0);
});

test('service update locks and authorizes the service and category in one transaction', async () => {
  const statements = [];
  let poolQueries = 0;
  db.query = async () => {
    poolQueries += 1;
    throw new Error('Service mutations must use their transaction client.');
  };
  db.withTransaction = async callback => callback({
    query: async (sql, params) => {
      statements.push({ sql, params });
      if (/SELECT id, brand_id, category_id, price_isk, sale_price_isk\s+FROM services/.test(sql)) {
        return { rows: [{ id: 6, brand_id: 2, category_id: 4, price_isk: '12000', sale_price_isk: null }] };
      }
      if (sql.includes('FROM categories WHERE id = $1')) return { rows: [{ id: 4 }] };
      if (sql.includes('UPDATE services')) {
        return { rows: [{ id: 6, brand_id: 2, category_id: 4, price_isk: 12000, sale_price_isk: 9000 }] };
      }
      return { rows: [] };
    },
  });

  const res = response();
  await serviceController.updateService({
    params: { id: '6' },
    user: { id: 1, type: 'staff', role: 'super_admin' },
    body: { sale_price_isk: 9000 },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(poolQueries, 0);
  assert.match(statements[0].sql, /FOR UPDATE/);
  assert.match(statements[1].sql, /FOR KEY SHARE/);
  assert.ok(statements[2].sql.includes('UPDATE services'));
  assert.equal(statements[2].params[7], 9000);
});
