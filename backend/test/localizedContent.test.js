const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const staffController = require('../src/controllers/staffController');
const categoryController = require('../src/controllers/categoryController');
const serviceController = require('../src/controllers/serviceController');
const staffServicesController = require('../src/controllers/staffServicesController');

const savedQuery = db.query;
const savedWithTransaction = db.withTransaction;

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
  db.withTransaction = savedWithTransaction;
});

test('category creation stores and returns English and Icelandic names and descriptions', async () => {
  let insert;
  db.query = async (sql, params) => {
    if (sql.includes('FROM categories WHERE id = $1')) return { rows: [{ id: 4 }] };
    insert = { sql, params };
    return {
      rows: [{
        id: 1,
        brand_id: 2,
        name_en: 'Brows',
        name_is: 'Augabrúnir',
        description_en: 'English details',
        description_is: 'Íslensk lýsing',
        name: 'Brows',
        title: 'Brows',
        description: 'English details',
        subtitle: 'English details',
      }],
    };
  };

  const res = response();
  await categoryController.createCategory({
    body: {
      brand_id: 2,
      name_en: 'Brows',
      name_is: 'Augabrúnir',
      description_en: 'English details',
      description_is: 'Íslensk lýsing',
    },
  }, res);

  assert.match(insert.sql, /name_en, name_is, description_en, description_is/);
  assert.deepEqual(insert.params, [2, 'Brows', 'Augabrúnir', 'English details', 'Íslensk lýsing']);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.category.name_is, 'Augabrúnir');
  assert.equal(res.body.category.description_is, 'Íslensk lýsing');
});

test('service creation stores and returns English and Icelandic names and descriptions', async () => {
  let insert;
  db.query = async (sql, params) => {
    if (sql.includes('FROM categories WHERE id = $1')) return { rows: [{ id: 4 }] };
    insert = { sql, params };
    return {
      rows: [{
        id: 3,
        brand_id: 2,
        category_id: 4,
        name_en: 'Lash lift',
        name_is: 'Augnháralyfting',
        description_en: 'English details',
        description_is: 'Íslensk lýsing',
        name: 'Lash lift',
        description: 'English details',
        duration_minutes: 45,
        price_isk: '12000',
        image_url: null,
        is_active: true,
      }],
    };
  };
  db.withTransaction = callback => callback({ query: db.query });

  const res = response();
  await serviceController.createService({
    body: {
      brand_id: 2,
      category_id: 4,
      name_en: 'Lash lift',
      name_is: 'Augnháralyfting',
      description_en: 'English details',
      description_is: 'Íslensk lýsing',
      duration_minutes: 45,
      price_isk: 12000,
    },
    user: { id: 1, type: 'staff', role: 'super_admin' },
  }, res);

  assert.match(insert.sql, /name_en, name_is, description_en, description_is/);
  assert.deepEqual(insert.params, [
    2, 4, 'Lash lift', 'Augnháralyfting', 'English details', 'Íslensk lýsing', 45, 12000, null, null, null,
  ]);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.service.name_is, 'Augnháralyfting');
  assert.equal(res.body.service.description_is, 'Íslensk lýsing');
});

test('staff creation stores and returns English and Icelandic descriptions', async () => {
  let insert;
  db.query = async (sql, params) => {
    if (/INSERT INTO staff \(/.test(sql)) {
      insert = { sql, params };
      return {
        rows: [{
          id: 5,
          role_id: 3,
          username: 'artist',
          full_name: 'Artist Name',
          description_en: 'English bio',
          description_is: 'Íslensk æviágrip',
          avatar_url: null,
        }],
      };
    }
    return { rows: [] };
  };
  db.withTransaction = callback => callback({ query: db.query });

  const res = response();
  await staffController.createStaff({
    body: {
      username: 'artist',
      password: 'not-a-real-account-password',
      full_name: 'Artist Name',
      description_en: 'English bio',
      description_is: 'Íslensk æviágrip',
      role_id: 3,
      brand_ids: [2],
    },
  }, res);

  assert.match(insert.sql, /description_en, description_is/);
  assert.equal(insert.params[4], 'English bio');
  assert.equal(insert.params[5], 'Íslensk æviágrip');
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.staff.description_en, 'English bio');
  assert.equal(res.body.staff.description_is, 'Íslensk æviágrip');
});

test('category, service, and staff updates write both locale fields', async () => {
  let categoryUpdate;
  db.query = async sql => {
    if (/SELECT \* FROM categories/.test(sql)) return { rows: [{ id: 1 }] };
    categoryUpdate = sql;
    return { rows: [] };
  };
  await categoryController.updateCategory({
    params: { id: '1' },
    body: {
      name_en: 'Brows',
      name_is: 'Augabrúnir',
      description_en: 'English details',
      description_is: 'Íslensk lýsing',
    },
  }, response());
  assert.match(categoryUpdate, /name_en = COALESCE/);
  assert.match(categoryUpdate, /name_is = COALESCE/);
  assert.match(categoryUpdate, /description_en = COALESCE/);
  assert.match(categoryUpdate, /description_is = COALESCE/);

  let serviceUpdate;
  db.query = async (sql, params) => {
    if (/SELECT id, brand_id, category_id, price_isk, sale_price_isk\s+FROM services/.test(sql)) {
      return { rows: [{ id: 3, brand_id: 2, category_id: 4, price_isk: '12000', sale_price_isk: null }] };
    }
    if (sql.includes('FROM categories WHERE id = $1')) return { rows: [{ id: 4 }] };
    serviceUpdate = sql;
    return { rows: [] };
  };
  db.withTransaction = callback => callback({ query: db.query });
  await serviceController.updateService({
    params: { id: '3' },
    body: {
      name_en: 'Lash lift',
      name_is: 'Augnháralyfting',
      description_en: 'English details',
      description_is: 'Íslensk lýsing',
    },
    user: { id: 1, type: 'staff', role: 'super_admin' },
  }, response());
  assert.match(serviceUpdate, /name_en = COALESCE/);
  assert.match(serviceUpdate, /name_is = COALESCE/);
  assert.match(serviceUpdate, /description_en = COALESCE/);
  assert.match(serviceUpdate, /description_is = COALESCE/);

  let staffUpdate;
  db.query = async () => ({ rows: [{ id: 5, role_id: 3, avatar_url: null }] });
  db.withTransaction = callback => callback({
    query: async (sql, params) => {
      staffUpdate = { sql, params };
      return { rows: [] };
    },
  });
  const res = response();
  await staffController.updateStaff({
    params: { id: '5' },
    body: {
      description_en: 'English bio',
      description_is: 'Íslensk æviágrip',
    },
  }, res);
  assert.match(staffUpdate.sql, /description_en = COALESCE/);
  assert.match(staffUpdate.sql, /description_is = COALESCE/);
  assert.equal(staffUpdate.params[2], 'English bio');
  assert.equal(staffUpdate.params[3], 'Íslensk æviágrip');
  assert.equal(res.statusCode, 200);
});

test('staff service reads include localized service and category fields', async () => {
  let queryText;
  db.query = async sql => {
    queryText = sql;
    return { rows: [] };
  };

  await staffServicesController.getStaffServices({ params: { staffId: '5' } }, response());

  assert.match(queryText, /s\.name_en AS service_name_en/);
  assert.match(queryText, /s\.name_is AS service_name_is/);
  assert.match(queryText, /s\.description_en AS service_description_en/);
  assert.match(queryText, /s\.description_is AS service_description_is/);
  assert.match(queryText, /c\.name_en AS category_name_en/);
  assert.match(queryText, /c\.name_is AS category_name_is/);
});
