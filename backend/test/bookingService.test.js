const test = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/config/db');
const { BookingError, createBooking } = require('../src/services/bookingService');
const { validateBookingRequest } = require('../src/services/bookingContract');

const booking = validateBookingRequest({
  brand_id: 1,
  service_id: 2,
  staff_id: 3,
  full_name: 'Test Customer',
  phone_number: '+354 555 1234',
  kennitala: '010190-1234',
  start_time: '2026-10-01T10:00:00Z',
  consent_privacy: true,
}).value;

const makeDatabase = ({ service = { brand_id: 1, duration_minutes: 45, price_isk: '12000' }, existingCustomer = null } = {}) => {
  const customers = existingCustomer ? [existingCustomer] : [];
  const appointments = [];
  let nextCustomerId = customers.length ? Math.max(...customers.map(customer => customer.id)) + 1 : 1;
  const lockTails = new Map();

  const createClient = () => {
    const releases = [];
    return {
      async query(text, params = []) {
        if (text.includes('pg_advisory_xact_lock')) {
          const key = params[0];
          const prior = lockTails.get(key) || Promise.resolve();
          let release;
          const current = new Promise(resolve => { release = resolve; });
          const tail = prior.then(() => current);
          lockTails.set(key, tail);
          await prior;
          releases.push(() => {
            release();
            if (lockTails.get(key) === tail) lockTails.delete(key);
          });
          return { rows: [] };
        }
        if (text.includes('FROM services s')) return { rows: service ? [service] : [] };
        if (text.includes('FROM staff_availabilities availability')) return { rows: [{ available: true }] };
        if (text.includes('FROM customers')) {
          if (text.includes('WHERE id = $1')) {
            return { rows: customers.filter(customer => customer.id === params[0] && customer.is_registered) };
          }
          return { rows: customers.filter(customer => customer.kennitala.replace(/\D/g, '') === params[0]).slice(0, 1) };
        }
        if (text.includes('INSERT INTO customers')) {
          const customer = { id: nextCustomerId++, kennitala: params[2], is_registered: false };
          customers.push(customer);
          return { rows: [{ id: customer.id }] };
        }
        if (text.includes('INSERT INTO appointments')) {
          appointments.push(params);
          return { rows: [{ id: appointments.length, params }] };
        }
        throw new Error(`Unexpected query: ${text}`);
      },
      releaseLocks() {
        for (const release of releases.reverse()) release();
      },
    };
  };

  return {
    customers,
    appointments,
    database: {
      async withTransaction(callback) {
        const client = createClient();
        try {
          return await callback(client);
        } finally {
          client.releaseLocks();
        }
      },
    },
  };
};

test('creates appointments with database-owned duration and price snapshots', async () => {
  const { database, appointments } = makeDatabase();

  const result = await createBooking(database, { ...booking, duration_minutes: 1, price_isk: 1 });

  assert.equal(appointments.length, 1);
  assert.equal(appointments[0][6], 45);
  assert.equal(appointments[0][7], 12000);
  assert.equal(appointments[0][5].getTime() - appointments[0][4].getTime(), 45 * 60_000);
  assert.equal(result.id, 1);
});

test('rejects unavailable, inactive, unassigned, or brand-mismatched selections', async () => {
  const { database, customers, appointments } = makeDatabase({ service: null });

  await assert.rejects(createBooking(database, booking), error => error instanceof BookingError && error.status === 422);
  assert.equal(customers.length, 0);
  assert.equal(appointments.length, 0);
});

test('requires registered customers to use the authenticated booking flow', async () => {
  const { database, appointments } = makeDatabase({
    existingCustomer: { id: 9, kennitala: '0101901234', is_registered: true },
  });

  await assert.rejects(createBooking(database, booking), error => error instanceof BookingError && error.status === 409);
  assert.equal(appointments.length, 0);
});

test('serializes concurrent guest resolution so one Kennitala creates one customer', async () => {
  const { database, customers, appointments } = makeDatabase();

  await Promise.all([createBooking(database, booking), createBooking(database, booking)]);

  assert.equal(customers.length, 1);
  assert.equal(appointments.length, 2);
});

test('checks out one client and rolls back failed transactions', async () => {
  const statements = [];
  let released = false;
  const client = {
    async query(statement) { statements.push(statement); },
    release() { released = true; },
  };
  const database = createDatabase({
    async connect() { return client; },
    query() { throw new Error('pool.query should not be used inside the transaction'); },
  });

  await assert.rejects(database.withTransaction(async transactionClient => {
    assert.equal(transactionClient, client);
    await transactionClient.query('UPDATE test_table');
    throw new Error('booking failed');
  }), /booking failed/);

  assert.deepEqual(statements, ['BEGIN', 'UPDATE test_table', 'ROLLBACK']);
  assert.equal(released, true);
});

test('books a registered customer using the authenticated database identity', async () => {
  const { database, appointments } = makeDatabase({
    existingCustomer: { id: 7, kennitala: '010190-1234', is_registered: true },
  });

  const result = await createBooking(database, { ...booking, customerId: 7, kennitala: null });

  assert.equal(result.id, 1);
  assert.equal(appointments[0][3], 7);
});