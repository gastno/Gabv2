const test = require('node:test');
const assert = require('node:assert/strict');
const {
  NotificationConfigurationError,
  buildEmail,
  deliverOne,
  enqueueDueReminders,
  enqueueStatusTransition,
  sendWithResend,
} = require('../src/services/notificationService');

const notification = {
  id: 19,
  appointment_id: 41,
  customer_id: 8,
  notification_type: 'status_transition',
  previous_status: 'pending',
  next_status: 'confirmed',
  event_key: 'status:41:pending:confirmed',
  attempts: 0,
  created_at: new Date(),
  email: 'customer@example.com',
  start_time: '2026-11-01T12:00:00Z',
  service_name: 'Lash lift',
  brand_name: 'Gabbablu',
};

test('status event key captures only the actual prior and next appointment states', async () => {
  let query;
  await enqueueStatusTransition({
    query: async (text, params) => {
      query = { text, params };
      return { rows: [] };
    },
  }, { id: 41, customer_id: 8 }, 'pending', 'confirmed');

  assert.match(query.text, /'status_transition'/);
  assert.match(query.text, /ON CONFLICT \(event_key\) DO NOTHING/);
  assert.deepEqual(query.params, [41, 8, 'pending', 'confirmed', 'status:41:pending:confirmed']);
  assert.throws(
    () => enqueueStatusTransition({ query: async () => ({ rows: [] }) }, { id: 41, customer_id: 8 }, 'pending', 'pending'),
    /persisted appointment status transition/
  );
});

test('reminder scan is bounded to upcoming appointments and database-deduplicated', async () => {
  let query;
  const now = new Date('2026-10-26T12:00:00Z');
  await enqueueDueReminders({
    query: async (text, params) => {
      query = { text, params };
      return { rows: [{ id: 1 }, { id: 2 }] };
    },
  }, now);

  assert.equal(query.params[0], now);
  assert.match(query.text, /a\.start_time > \$1/);
  assert.match(query.text, /a\.start_time <= \$1 \+ INTERVAL '24 hours'/);
  assert.match(query.text, /ON CONFLICT DO NOTHING/);
});

test('notification content describes the correct event using the studio timezone', () => {
  const reminder = buildEmail({ ...notification, notification_type: 'reminder_24h' });
  assert.match(reminder.subject, /Reminder/);
  assert.match(reminder.text, /Gabbablu/);
  assert.match(reminder.text, /Lash lift/);

  const transition = buildEmail(notification);
  assert.match(transition.subject, /confirmed/);
  assert.match(transition.text, /pending to confirmed/);
});

test('Resend delivery fails explicitly without configuration and sends with a stable idempotency key', async () => {
  await assert.rejects(
    sendWithResend(notification, {}, async () => { throw new Error('Provider must not be called.'); }),
    error => error instanceof NotificationConfigurationError
  );

  let request;
  const response = await sendWithResend(notification, {
    RESEND_API_KEY: 'test-key',
    RESEND_FROM_EMAIL: 'appointments@example.com',
  }, async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ id: 'provider-message-1' }) };
  });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.headers['Idempotency-Key'], notification.event_key);
  assert.equal(JSON.parse(request.options.body).to[0], notification.email);
  assert.deepEqual(response, { id: 'provider-message-1' });
});

test('delivery claims each queued event once and records the provider outcome', async () => {
  let status = 'queued';
  const preferenceEnabled = true;
  let delivered = 0;
  const statements = [];
  const database = {
    async withTransaction(callback) {
      return callback({
        async query(text) {
          statements.push(text);
          if (text.includes('FROM appointment_notifications n')) {
            return { rows: status === 'queued' ? [{ ...notification }] : [] };
          }
          if (text.includes('SELECT email_enabled')) {
            return { rows: [{ email_enabled: preferenceEnabled }] };
          }
          if (text.includes("SET delivery_status = 'sending'")) {
            status = 'sending';
          }
          return { rows: [] };
        },
      });
    },
    async query(text, params) {
      statements.push(text);
      if (text.includes('SET delivery_status = $1')) status = params[0];
      if (text.includes("SET delivery_status = 'sent'")) status = 'sent';
      return { rows: [] };
    },
  };

  assert.equal(await deliverOne(database, async () => {
    delivered += 1;
    return { id: 'provider-message-1' };
  }), true);
  assert.equal(status, 'sent');
  assert.equal(delivered, 1);
  assert.equal(await deliverOne(database, async () => {
    delivered += 1;
    return { id: 'duplicate' };
  }), false);
  assert.equal(delivered, 1);
  assert.ok(statements.some(text => text.includes('FOR UPDATE OF n SKIP LOCKED')));
});

test('delivery skips events when the customer has not opted in', async () => {
  let status = 'queued';
  let providerCalled = false;
  const database = {
    async withTransaction(callback) {
      return callback({
        async query(text) {
          if (text.includes('FROM appointment_notifications n')) {
            return { rows: status === 'queued' ? [{ ...notification }] : [] };
          }
          if (text.includes('SELECT email_enabled')) return { rows: [{ email_enabled: false }] };
          if (text.includes("SET delivery_status = 'skipped'")) status = 'skipped';
          return { rows: [] };
        },
      });
    },
    async query() { return { rows: [] }; },
  };

  assert.equal(await deliverOne(database, async () => {
    providerCalled = true;
    return { id: 'unexpected' };
  }), false);
  assert.equal(status, 'skipped');
  assert.equal(providerCalled, false);
});
