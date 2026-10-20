const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const controller = require('../src/controllers/brandController');

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
