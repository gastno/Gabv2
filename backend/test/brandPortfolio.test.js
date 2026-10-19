const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const brandAccess = require('../src/middleware/brandAccessMiddleware');
const controller = require('../src/controllers/brandController');

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

test('brand administrators are checked against brand assignment while super admins bypass assignment lookup', async () => {
  const queries = [];
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [{ id: '2' }] };
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await brandAccess.requireBrandAccess({
    params: { id: '2' },
    user: { id: 8, role: 'admin' },
  }, response(), next);
  assert.equal(nextCalled, true);
  assert.deepEqual(queries[0].params, ['2', 'admin', 8]);
  assert.match(queries[0].sql, /staff_brands/);

  queries.length = 0;
  nextCalled = false;
  await brandAccess.requireBrandAccess({
    params: { id: '2' },
    user: { id: 1, role: 'super_admin' },
  }, response(), next);
  assert.equal(nextCalled, true);
  assert.deepEqual(queries[0].params, ['2', 'super_admin', 1]);
});

test('brand administrators cannot access another brand and invalid brand IDs are rejected', async () => {
  let queryCount = 0;
  db.query = async () => {
    queryCount += 1;
    return queryCount === 1 ? { rows: [] } : { rows: [{ id: '2' }] };
  };

  const deniedResponse = response();
  await brandAccess.requireBrandAccess({
    params: { id: '2' },
    user: { id: 8, role: 'admin' },
  }, deniedResponse, () => assert.fail('Denied request must not continue.'));
  assert.equal(deniedResponse.statusCode, 403);
  assert.equal(deniedResponse.body.error, 'You do not have access to this brand.');

  queryCount = 0;
  const invalidResponse = response();
  await brandAccess.requireBrandAccess({
    params: { id: '0' },
    user: { id: 8, role: 'admin' },
  }, invalidResponse, () => assert.fail('Invalid request must not continue.'));
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(queryCount, 0);
});

test('portfolio updates validate preset and replace gallery order as one transaction', async () => {
  const statements = [];
  db.withTransaction = async callback => callback({
    async query(sql, params) {
      statements.push({ sql, params });
      if (sql.includes('SELECT id FROM brands')) return { rows: [{ id: '3' }] };
      if (sql.includes('SELECT id') && sql.includes('brand_portfolio_images')) {
        return { rows: [{ id: '12' }, { id: '8' }] };
      }
      return { rows: [] };
    },
  });
  db.query = async sql => {
    assert.match(sql, /LEFT JOIN brand_portfolio_images/);
    return {
      rows: [{
        id: '3',
        gallery_layout: 'mosaic',
        images: [
          { id: '8', image_url: '/uploads/brands/8.webp', display_order: 0 },
          { id: '12', image_url: '/uploads/brands/12.webp', display_order: 1 },
        ],
      }],
    };
  };

  const res = response();
  await controller.updatePortfolio({
    params: { id: '3' },
    body: { layout: 'mosaic', image_ids: ['8', '12'] },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.layout, 'mosaic');
  assert.deepEqual(res.body.images.map(image => image.id), ['8', '12']);
  assert.deepEqual(
    statements.filter(statement => statement.sql.startsWith('UPDATE brand_portfolio_images'))
      .map(statement => statement.params),
    [[0, '8', '3'], [1, '12', '3']]
  );
});

test('portfolio updates reject unsupported layouts and incomplete image orders without writing', async () => {
  let transactionCount = 0;
  db.withTransaction = async () => {
    transactionCount += 1;
    return { invalidImages: true };
  };

  const invalidLayoutResponse = response();
  await controller.updatePortfolio({
    params: { id: '3' },
    body: { layout: 'unsupported', image_ids: [] },
  }, invalidLayoutResponse);
  assert.equal(invalidLayoutResponse.statusCode, 400);
  assert.equal(transactionCount, 0);

  const incompleteResponse = response();
  await controller.updatePortfolio({
    params: { id: '3' },
    body: { layout: 'grid', image_ids: ['8'] },
  }, incompleteResponse);
  assert.equal(incompleteResponse.statusCode, 400);
  assert.equal(transactionCount, 1);
});

test('portfolio uploads reject files that are not decodable images', async () => {
  let transactionCount = 0;
  db.withTransaction = async () => {
    transactionCount += 1;
    return null;
  };
  const res = response();

  await controller.uploadPortfolioImage({
    params: { id: '3' },
    file: { buffer: Buffer.from('not an image') },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Uploaded file is not a valid image.');
  assert.equal(transactionCount, 0);
});
