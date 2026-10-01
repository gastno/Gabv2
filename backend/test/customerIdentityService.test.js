const test = require('node:test');
const assert = require('node:assert/strict');
const { CustomerIdentityError, registerCustomerProfile } = require('../src/services/customerIdentityService');

const profile = {
  fullName: 'Test Customer',
  phoneNumber: '+354 555 1234',
  kennitala: '010190-1234',
  email: 'test@example.invalid',
  passwordHash: 'hashed-password',
};

const makeDatabase = existingRows => {
  const statements = [];
  return {
    statements,
    database: {
      async withTransaction(callback) {
        return callback({
          async query(text, params) {
            statements.push({ text, params });
            if (text.includes('FROM customers')) return { rows: existingRows };
            if (text.includes('INSERT INTO customers')) return { rows: [{ id: 7, full_name: params[0], email: params[3] }] };
            return { rows: [] };
          },
        });
      },
    },
  };
};

test('registration does not claim an existing guest profile', async () => {
  const { database, statements } = makeDatabase([{ id: 3 }]);

  await assert.rejects(registerCustomerProfile(database, profile), error => error instanceof CustomerIdentityError);
  assert.equal(statements.some(statement => statement.text.includes('INSERT INTO customers')), false);
});

test('registration does not duplicate an existing registered identity', async () => {
  const { database, statements } = makeDatabase([{ id: 3 }]);

  await assert.rejects(registerCustomerProfile(database, profile), error => error.status === 409);
  assert.equal(statements.some(statement => statement.text.includes('INSERT INTO customers')), false);
});

test('registration inserts a profile under the Kennitala advisory lock when identity is new', async () => {
  const { database, statements } = makeDatabase([]);

  const customer = await registerCustomerProfile(database, profile);

  assert.equal(customer.id, 7);
  assert.match(statements[0].text, /pg_advisory_xact_lock/);
  assert.equal(statements[0].params[0], '0101901234');
});