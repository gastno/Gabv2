const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const controller = require('../src/controllers/brandController');
const brandRoutes = require('../src/routes/brandRoutes');

const savedQuery = db.query;

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test.afterEach(() => {
  db.query = savedQuery;
});

test('brand update writes both localized descriptions and preserves the English legacy alias', async () => {
  let update;
  db.query = async (sql, params) => {
    update = { sql, params };
    return {
      rows: [{
        id: '4',
        description_en: 'English description',
        description_is: 'Íslensk lýsing',
        about_description: 'English description',
      }],
    };
  };

  const res = response();
  await controller.updateBrand({
    params: { id: '4' },
    body: {
      description_en: 'English description',
      description_is: 'Íslensk lýsing',
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.brand.description_en, 'English description');
  assert.equal(res.body.brand.description_is, 'Íslensk lýsing');
  assert.equal(res.body.brand.about_description, 'English description');
  assert.match(update.sql, /description_en = CASE/);
  assert.match(update.sql, /description_is = CASE/);
  assert.deepEqual(update.params, [
    false, null, false, null,
    true, 'English description',
    true, 'Íslensk lýsing',
    false, null, '4',
  ]);
});

test('legacy about_description updates English content and the response exposes both locale fields', async () => {
  let query;
  db.query = async (sql, params) => {
    query = { sql, params };
    return { rows: [] };
  };

  const legacyUpdateResponse = response();
  await controller.updateBrand({
    params: { id: '4' },
    body: { about_description: 'Legacy English description' },
  }, legacyUpdateResponse);
  assert.equal(legacyUpdateResponse.statusCode, 404);
  assert.equal(query.params[4], false);
  assert.equal(query.params[6], false);
  assert.equal(query.params[8], true);
  assert.equal(query.params[9], 'Legacy English description');
  assert.match(query.sql, /WHEN \$5 THEN \$6 WHEN \$9 THEN \$10/);

  db.query = async sql => {
    query = { sql };
    return { rows: [] };
  };
  await controller.getAllBrands({}, response());
  assert.match(query.sql, /description_en, description_is/);
  assert.match(query.sql, /COALESCE\(description_en, about_description\) AS about_description/);
  assert.match(query.sql, /logo_url/);
});

test('manageable brands are scoped to the current active administrator', async () => {
  const queries = [];
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return queries.length === 1
      ? { rows: [{ role: 'admin' }] }
      : { rows: [{ id: '1', name: 'Gabbablu', gallery_layout: 'grid' }] };
  };
  const res = response();
  await controller.getManageableBrands({ user: { id: '7', type: 'staff', role: 'admin' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 1);
  assert.deepEqual(queries[0].params, ['7', 'admin']);
  assert.match(queries[0].sql, /s\.is_active = TRUE/);
  assert.deepEqual(queries[1].params, ['7', 'admin']);
  assert.match(queries[1].sql, /sb\.staff_id = \$1 AND sb\.brand_id = b\.id/);
  assert.match(queries[1].sql, /b\.logo_url/);
});

test('manageable brands allow super admins and reject inactive or changed accounts', async () => {
  let queries = [];
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return queries.length === 1 ? { rows: [{ role: 'super_admin' }] } : { rows: [{ id: '1' }, { id: '2' }] };
  };
  const superRes = response();
  await controller.getManageableBrands({ user: { id: '8', type: 'staff', role: 'super_admin' } }, superRes);
  assert.equal(superRes.body.length, 2);
  assert.deepEqual(queries[1].params, ['8', 'super_admin']);
  assert.match(queries[1].sql, /\$2 = 'super_admin'/);

  queries = [];
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [] };
  };
  const denied = response();
  await controller.getManageableBrands({ user: { id: '8', type: 'staff', role: 'admin' } }, denied);
  assert.equal(denied.statusCode, 403);
  assert.equal(queries.length, 1);

  const customer = response();
  await controller.getManageableBrands({ user: { id: '8', type: 'customer', role: 'admin' } }, customer);
  assert.equal(customer.statusCode, 403);
  assert.equal(queries.length, 1);
});

test('manageable brands route authenticates and restricts access to administrator roles', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-for-manageable-brands';
  let queryCount = 0;
  db.query = async (sql, params) => {
    queryCount += 1;
    if (sql.includes('FROM staff s JOIN roles')) {
      return { rows: [{ role: params[1] }] };
    }
    return { rows: [{ id: '1', name: 'Gabbablu' }, { id: '2', name: 'Amor Tattoo' }] };
  };
  const app = express();
  app.use('/api/brands', brandRoutes);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/brands/manageable`;
  const auth = payload => ({
    Authorization: `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`,
  });
  try {
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers: auth({ id: 1, type: 'staff', role: 'staff' }) })).status, 403);
    assert.equal((await fetch(url, { headers: auth({ id: 1, type: 'customer', role: 'admin' }) })).status, 403);
    assert.equal(queryCount, 0);
    const result = await fetch(url, { headers: auth({ id: 1, type: 'staff', role: 'admin' }) });
    assert.equal(result.status, 200);
    assert.deepEqual((await result.json()).map(brand => brand.name), ['Gabbablu', 'Amor Tattoo']);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('brand update rejects non-string localized descriptions', async () => {
  let queryCount = 0;
  db.query = async () => {
    queryCount += 1;
    return { rows: [] };
  };

  const res = response();
  await controller.updateBrand({
    params: { id: '4' },
    body: { description_is: { invalid: true } },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(queryCount, 0);
});
