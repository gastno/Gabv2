const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const controller = require('../src/controllers/apptController');

const savedQuery = db.query;
const savedWithTransaction = db.withTransaction;
const appointment = {
  id: 41,
  brand_id: 2,
  service_id: 7,
  staff_id: 3,
  customer_id: 8,
  status: 'confirmed',
  fee_status: 'none',
  payment_status: 'pending',
  customer_name: 'Customer Name',
  customer_phone: '+3540000000',
  customer_email: 'customer@example.com',
  customer_kennitala: '0000000000',
};

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

test('appointment list and detail responses include customer email and Kennitala while preserving access scope', async () => {
  const queries = [];
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [appointment] };
  };

  const listResponse = response();
  await controller.listAppointments({
    user: { id: 3, type: 'staff', role: 'staff' },
    query: {},
  }, listResponse);

  const detailResponse = response();
  await controller.getAppointment({
    params: { id: '41' },
    user: { id: 3, type: 'staff', role: 'staff' },
  }, detailResponse);

  assert.equal(listResponse.body.appointments[0].customer_email, 'customer@example.com');
  assert.equal(listResponse.body.appointments[0].customer_kennitala, '0000000000');
  assert.equal(listResponse.body.appointments[0].payment_status, 'pending');
  assert.equal(detailResponse.body.appointment.customer_email, 'customer@example.com');
  assert.equal(detailResponse.body.appointment.customer_kennitala, '0000000000');
  assert.equal(detailResponse.body.appointment.payment_status, 'pending');
  assert.equal(queries.length, 2);
  for (const { sql } of queries) {
    assert.match(sql, /customer\.email AS customer_email/);
    assert.match(sql, /customer\.kennitala AS customer_kennitala/);
    assert.match(sql, /a\.payment_status/);
  }
  assert.deepEqual(queries[0].params, [3]);
  assert.deepEqual(queries[1].params, [41]);

  const deniedResponse = response();
  await controller.getAppointment({
    params: { id: '41' },
    user: { id: 99, type: 'staff', role: 'staff' },
  }, deniedResponse);
  assert.equal(deniedResponse.statusCode, 403);
  assert.equal(deniedResponse.body.appointment, undefined);
});

test('fee-status updates accept each enum value and return the saved row without changing appointment status', async () => {
  const validStatuses = ['none', 'awaiting_fee', 'fee_charged', 'fee_waived'];
  const statements = [];
  const client = {
    async query(sql, params) {
      statements.push({ sql, params });
      if (sql.startsWith('SELECT')) return { rows: [{ ...appointment }] };
      return { rows: [{ ...appointment, fee_status: params[0] }] };
    },
  };
  db.withTransaction = async callback => callback(client);

  for (const feeStatus of validStatuses) {
    const res = response();
    await controller.updateAppointmentFeeStatus({
      params: { id: '41' },
      body: { fee_status: feeStatus },
      user: { id: 3, type: 'staff', role: 'staff' },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.appointment.fee_status, feeStatus);
    assert.equal(res.body.appointment.status, 'confirmed');
  }

  const updates = statements.filter(({ sql }) => sql.startsWith('UPDATE'));
  assert.equal(updates.length, validStatuses.length);
  for (const update of updates) {
    assert.match(update.sql, /SET fee_status = \$1, updated_at = NOW\(\)/);
    assert.doesNotMatch(update.sql, /(?:SET\s+|,\s*)status\s*=/);
  }
});

test('payment-status updates accept pending and accepted and return the saved row', async () => {
  const validStatuses = ['pending', 'accepted'];
  const statements = [];
  const client = {
    async query(sql, params) {
      statements.push({ sql, params });
      if (sql.startsWith('SELECT')) return { rows: [{ ...appointment }] };
      return { rows: [{ ...appointment, payment_status: params[0] }] };
    },
  };
  db.withTransaction = async callback => callback(client);

  for (const paymentStatus of validStatuses) {
    const res = response();
    await controller.updateAppointmentPaymentStatus({
      params: { id: '41' },
      body: { payment_status: paymentStatus },
      user: { id: 3, type: 'staff', role: 'staff' },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.appointment.payment_status, paymentStatus);
    assert.equal(res.body.appointment.status, 'confirmed');
  }

  const updates = statements.filter(({ sql }) => sql.startsWith('UPDATE'));
  assert.equal(updates.length, validStatuses.length);
  for (const update of updates) {
    assert.match(update.sql, /SET payment_status = \$1, updated_at = NOW\(\)/);
    assert.doesNotMatch(update.sql, /(?:SET\s+|,\s*)status\s*=/);
  }
});

test('payment-status updates reject invalid input and non-staff principals', async () => {
  let transactionCount = 0;
  db.withTransaction = async callback => {
    transactionCount += 1;
    return callback({ query: async () => ({ rows: [] }) });
  };

  for (const request of [
    { params: { id: '0' }, body: { payment_status: 'pending' }, user: { id: 3, type: 'staff', role: 'staff' } },
    { params: { id: '41' }, body: { payment_status: 'declined' }, user: { id: 3, type: 'staff', role: 'staff' } },
    { params: { id: '41' }, body: {}, user: { id: 3, type: 'staff', role: 'staff' } },
    { params: { id: '41' }, body: { payment_status: 'accepted' }, user: { id: 8, type: 'customer', role: 'customer' } },
  ]) {
    const res = response();
    await controller.updateAppointmentPaymentStatus(request, res);
    assert.ok([400, 403].includes(res.statusCode));
    assert.ok(res.body.error);
  }
  assert.equal(transactionCount, 0);
});

test('fee-status updates reject invalid IDs and fee statuses before opening a transaction', async () => {
  let transactionCount = 0;
  db.withTransaction = async callback => {
    transactionCount += 1;
    return callback({ query: async () => ({ rows: [] }) });
  };

  for (const request of [
    { params: { id: '0' }, body: { fee_status: 'none' } },
    { params: { id: '41' }, body: { fee_status: 'paid' } },
    { params: { id: '41' }, body: {} },
  ]) {
    const res = response();
    await controller.updateAppointmentFeeStatus({ ...request, user: { id: 3, type: 'staff', role: 'staff' } }, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  }
  assert.equal(transactionCount, 0);
});

test('fee-status updates reject non-staff principals before opening a transaction', async () => {
  let transactionCount = 0;
  db.withTransaction = async callback => {
    transactionCount += 1;
    return callback({ query: async () => ({ rows: [] }) });
  };

  const res = response();
  await controller.updateAppointmentFeeStatus({
    params: { id: '41' },
    body: { fee_status: 'fee_charged' },
    user: { id: 8, type: 'customer', role: 'customer' },
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(transactionCount, 0);
});

test('fee-status updates return 404 when the appointment does not exist', async () => {
  let updateAttempted = false;
  db.withTransaction = async callback => callback({
    async query(sql) {
      if (sql.startsWith('UPDATE')) updateAttempted = true;
      return { rows: [] };
    },
  });

  const res = response();
  await controller.updateAppointmentFeeStatus({
    params: { id: '41' },
    body: { fee_status: 'fee_charged' },
    user: { id: 3, type: 'staff', role: 'staff' },
  }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(updateAttempted, false);
});

test('fee-status updates enforce assigned staff and admin brand scope', async () => {
  let updateAttempted = false;
  db.withTransaction = async callback => callback({
    async query(sql) {
      if (sql.startsWith('SELECT id')) return { rows: [{ ...appointment }] };
      if (sql.startsWith('SELECT 1 FROM staff_brands')) return { rows: [] };
      if (sql.startsWith('UPDATE')) updateAttempted = true;
      return { rows: [] };
    },
  });

  for (const user of [
    { id: 99, type: 'staff', role: 'staff' },
    { id: 99, type: 'staff', role: 'admin' },
  ]) {
    const res = response();
    await controller.updateAppointmentFeeStatus({
      params: { id: '41' },
      body: { fee_status: 'fee_waived' },
      user,
    }, res);
    assert.equal(res.statusCode, 403);
  }
  assert.equal(updateAttempted, false);
});
