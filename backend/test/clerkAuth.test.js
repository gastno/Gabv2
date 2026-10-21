const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const authController = require('../src/controllers/authController');
const clerkIdentityService = require('../src/services/clerkIdentityService');
const { TokenVerificationErrorReason } = require('@clerk/backend/errors');
const {
  completeClerkCustomerProfile,
} = require('../src/services/customerIdentityService');
const {
  createClerkIdentityVerifier,
  ClerkIdentityProviderError,
  InvalidClerkIdentityError,
} = clerkIdentityService;

const savedQuery = db.query;
const savedWithTransaction = db.withTransaction;
const savedVerifier = clerkIdentityService.verifyClerkIdentity;
const savedJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'clerk-auth-test-secret';

const identity = {
  subject: 'user_test123',
  email: 'customer@example.invalid',
  fullName: 'Clerk Customer',
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

const request = (body = {}) => ({
  headers: { authorization: 'Bearer verified-session-token' },
  body,
});

test.afterEach(() => {
  db.query = savedQuery;
  db.withTransaction = savedWithTransaction;
  clerkIdentityService.verifyClerkIdentity = savedVerifier;
});

test.after(() => {
  if (savedJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = savedJwtSecret;
});

test('mapped Clerk session returns a Gabv2 customer JWT', async () => {
  const customer = { id: 12, full_name: 'Mapped Customer', email: identity.email };
  clerkIdentityService.verifyClerkIdentity = async token => {
    assert.equal(token, 'verified-session-token');
    return identity;
  };
  db.query = async (sql, params) => {
    assert.match(sql, /customer_identities/);
    assert.deepEqual(params, [identity.subject]);
    return { rows: [customer] };
  };

  const res = response();
  await authController.clerkCustomerSession(request(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'authenticated');
  assert.deepEqual(res.body.customer, customer);
  assert.deepEqual(jwt.verify(res.body.token, process.env.JWT_SECRET), {
    id: customer.id,
    email: customer.email,
    role: 'customer',
    type: 'customer',
    iat: jwt.decode(res.body.token).iat,
    exp: jwt.decode(res.body.token).exp,
  });
});

test('invalid Clerk session is rejected', async () => {
  clerkIdentityService.verifyClerkIdentity = async () => {
    throw new InvalidClerkIdentityError();
  };

  const res = response();
  await authController.clerkCustomerSession(request(), res);

  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /Clerk session/);
});

test('unmapped Clerk identity receives profile-required without customer creation', async () => {
  clerkIdentityService.verifyClerkIdentity = async () => identity;
  db.query = async () => ({ rows: [] });
  db.withTransaction = async () => {
    assert.fail('A new profile must not be created by the session endpoint.');
  };

  const res = response();
  await authController.clerkCustomerSession(request(), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    status: 'profile_required',
    profile: { full_name: identity.fullName, email: identity.email },
  });
});

test('profile completion uses verified identity and returns a customer JWT', async () => {
  clerkIdentityService.verifyClerkIdentity = async () => identity;
  const statements = [];
  db.withTransaction = callback => callback({
    async query(sql, params) {
      statements.push({ sql, params });
      if (sql.includes('FROM customer_identities')) return { rows: [] };
      if (sql.includes('FROM customers')) return { rows: [] };
      if (sql.includes('INSERT INTO customers')) {
        return { rows: [{ id: 18, full_name: params[0], email: params[3] }] };
      }
      return { rows: [] };
    },
  });

  const res = response();
  await authController.completeClerkCustomerProfile(request({
    full_name: 'New Customer',
    phone_number: '+354 555 0101',
    kennitala: '010190-1234',
    email: 'untrusted@example.invalid',
    customer_id: 999,
    role: 'admin',
  }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'authenticated');
  assert.deepEqual(res.body.customer, {
    id: 18,
    full_name: 'New Customer',
    email: identity.email,
  });
  const customerInsert = statements.find(statement => statement.sql.includes('INSERT INTO customers'));
  assert.deepEqual(customerInsert.params, [
    'New Customer',
    '+354 555 0101',
    '010190-1234',
    identity.email,
  ]);
  const mappingInsert = statements.find(statement => statement.sql.includes('INSERT INTO customer_identities'));
  assert.deepEqual(mappingInsert.params, [identity.subject, 18]);
  assert.deepEqual(jwt.verify(res.body.token, process.env.JWT_SECRET), {
    id: 18,
    email: identity.email,
    role: 'customer',
    type: 'customer',
    iat: jwt.decode(res.body.token).iat,
    exp: jwt.decode(res.body.token).exp,
  });
});

test('profile completion returns a generic conflict for an existing profile', async () => {
  clerkIdentityService.verifyClerkIdentity = async () => identity;
  const statements = [];
  db.withTransaction = callback => callback({
    async query(sql) {
      statements.push(sql);
      if (sql.includes('FROM customer_identities')) return { rows: [] };
      if (sql.includes('FROM customers')) return { rows: [{ id: 9 }] };
      return { rows: [] };
    },
  });

  const res = response();
  await authController.completeClerkCustomerProfile(request({
    full_name: 'New Customer',
    phone_number: '+354 555 0101',
    kennitala: '010190-1234',
  }), res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { error: 'Profile could not be completed with these details.' });
  assert.equal(statements.some(sql => sql.includes('INSERT INTO customers')), false);
  assert.equal(statements.some(sql => sql.includes('INSERT INTO customer_identities')), false);
});

test('concurrent profile completion for the same Clerk subject creates only one mapping', async () => {
  const state = { customer: null, mappings: [], locks: [], inserts: 0 };
  let transactionQueue = Promise.resolve();
  const database = {
    withTransaction(callback) {
      const transaction = transactionQueue.then(() => callback({
        async query(sql, params) {
          if (sql.includes('pg_advisory_xact_lock')) {
            state.locks.push(params[0]);
            return { rows: [] };
          }
          if (sql.includes('FROM customer_identities')) {
            return { rows: state.customer ? [state.customer] : [] };
          }
          if (sql.includes('FROM customers')) return { rows: [] };
          if (sql.includes('INSERT INTO customers')) {
            state.inserts += 1;
            state.customer = {
              id: 27,
              full_name: params[0],
              email: params[3],
            };
            return { rows: [state.customer] };
          }
          if (sql.includes('INSERT INTO customer_identities')) {
            state.mappings.push({ provider: 'clerk', subject: params[0], customerId: params[1] });
            return { rows: [] };
          }
          return { rows: [] };
        },
      }));
      transactionQueue = transaction.then(() => undefined);
      return transaction;
    },
  };

  const profile = {
    subject: identity.subject,
    fullName: 'Concurrent Customer',
    phoneNumber: '+354 555 0101',
    kennitala: '010190-1234',
    email: identity.email,
  };
  const customers = await Promise.all([
    completeClerkCustomerProfile(database, profile),
    completeClerkCustomerProfile(database, profile),
  ]);

  assert.equal(state.inserts, 1);
  assert.equal(state.mappings.length, 1);
  assert.deepEqual(customers[0], customers[1]);
  assert.ok(state.locks.includes(`clerk-subject:clerk:${identity.subject}`));
});

test('Clerk verifier constrains signature verification to the configured issuer and parties', async () => {
  let verificationOptions;
  let lookedUpSubject;
  const verifyIdentity = createClerkIdentityVerifier({
    env: {
      CLERK_SECRET_KEY: 'test-secret-key',
      CLERK_ISSUER: 'https://studio.clerk.accounts.dev',
      CLERK_AUTHORIZED_PARTIES: 'https://studio.example, http://localhost:3000',
    },
    verify: async (token, options) => {
      assert.equal(token, 'signed-session-token');
      verificationOptions = options;
      return {
        iss: options.issuer,
        sub: identity.subject,
        sid: 'sess_test123',
        azp: 'https://studio.example',
      };
    },
    createClient: ({ secretKey }) => {
      assert.equal(secretKey, 'test-secret-key');
      return {
        users: {
          async getUser(subject) {
            lookedUpSubject = subject;
            return {
              id: identity.subject,
              fullName: identity.fullName,
              primaryEmailAddressId: 'email_1',
              emailAddresses: [{
                id: 'email_1',
                emailAddress: identity.email,
                verification: { status: 'verified' },
              }],
            };
          },
        },
      };
    },
  });

  assert.deepEqual(await verifyIdentity('signed-session-token'), identity);
  assert.deepEqual(verificationOptions, {
    secretKey: 'test-secret-key',
    issuer: 'https://studio.clerk.accounts.dev',
    authorizedParties: ['https://studio.example', 'http://localhost:3000'],
  });
  assert.equal(lookedUpSubject, identity.subject);
});

test('Clerk verifier classifies reason-coded SDK errors without relying on instanceof', async () => {
  const config = {
    env: {
      CLERK_SECRET_KEY: 'test-secret-key',
      CLERK_ISSUER: 'https://studio.clerk.accounts.dev',
      CLERK_AUTHORIZED_PARTIES: 'http://localhost:3000',
    },
  };
  const invalidTokenVerifier = createClerkIdentityVerifier({
    ...config,
    verify: async () => {
      const error = new Error('Invalid token signature');
      error.reason = TokenVerificationErrorReason.TokenInvalidSignature;
      throw error;
    },
  });
  await assert.rejects(invalidTokenVerifier('invalid-session'), InvalidClerkIdentityError);

  const unavailableProviderVerifier = createClerkIdentityVerifier({
    ...config,
    verify: async () => {
      const error = new Error('JWK service unavailable');
      error.reason = TokenVerificationErrorReason.RemoteJWKFailedToLoad;
      throw error;
    },
  });
  await assert.rejects(unavailableProviderVerifier('session'), ClerkIdentityProviderError);
});

test('Clerk verifier rejects an unverified primary email and a mismatched issuer', async () => {
  let userFetches = 0;
  const verifyIdentity = createClerkIdentityVerifier({
    env: {
      CLERK_SECRET_KEY: 'test-secret-key',
      CLERK_ISSUER: 'https://studio.clerk.accounts.dev',
      CLERK_AUTHORIZED_PARTIES: 'https://studio.example',
    },
    verify: async () => ({
      iss: 'https://attacker.example',
      sub: identity.subject,
      sid: 'sess_test123',
      azp: 'https://studio.example',
    }),
    createClient: () => {
      userFetches += 1;
      return {
        users: {
          async getUser() {
            return {
              id: identity.subject,
              primaryEmailAddressId: 'email_1',
              emailAddresses: [{
                id: 'email_1',
                emailAddress: identity.email,
                verification: { status: 'unverified' },
              }],
            };
          },
        },
      };
    },
  });

  await assert.rejects(verifyIdentity('session'), InvalidClerkIdentityError);
  assert.equal(userFetches, 0);

  const unverifiedVerifier = createClerkIdentityVerifier({
    env: {
      CLERK_SECRET_KEY: 'test-secret-key',
      CLERK_ISSUER: 'https://studio.clerk.accounts.dev',
      CLERK_AUTHORIZED_PARTIES: 'https://studio.example',
    },
    verify: async () => ({
      iss: 'https://studio.clerk.accounts.dev',
      sub: identity.subject,
      sid: 'sess_test123',
      azp: 'https://studio.example',
    }),
    createClient: () => ({
      users: {
        async getUser() {
          return {
            id: identity.subject,
            primaryEmailAddressId: 'email_1',
            emailAddresses: [{
              id: 'email_1',
              emailAddress: identity.email,
              verification: { status: 'unverified' },
            }],
          };
        },
      },
    }),
  });
  await assert.rejects(unverifiedVerifier('session'), InvalidClerkIdentityError);
});
