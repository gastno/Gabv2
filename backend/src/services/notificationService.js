const { Resend } = require('resend');

const MAX_ATTEMPTS = 6;
const MAX_IDEMPOTENCY_AGE_MS = 23 * 60 * 60 * 1000;

class NotificationConfigurationError extends Error {}

const buildEmail = notification => {
  const startsAt = new Date(notification.start_time).toLocaleString('en-IS', {
    timeZone: 'Atlantic/Reykjavik',
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const title = notification.service_name || 'appointment';
  const studio = notification.brand_name || 'the studio';

  if (notification.notification_type === 'service_booked') {
    return {
      subject: `New service booking: ${title}`,
      text: `A new ${title} appointment at ${studio} has been booked for ${startsAt}${notification.customer_name ? ` by ${notification.customer_name}` : ''}.`,
    };
  }

  if (notification.notification_type === 'reminder_24h') {
    return {
      subject: `Reminder: ${title} is coming up`,
      text: `A reminder that your ${title} appointment at ${studio} is scheduled for ${startsAt}.`,
    };
  }
  return {
    subject: `Appointment ${notification.next_status}`,
    text: `Your ${title} appointment at ${studio} changed from ${notification.previous_status} to ${notification.next_status}. Appointment time: ${startsAt}.`,
  };
};

const sendWithResend = async (notification, environment = process.env, resendClient) => {
  if (!environment.RESEND_API_KEY || !environment.RESEND_FROM_EMAIL) {
    throw new NotificationConfigurationError('Email notification provider is not configured.');
  }
  const resend = resendClient || new Resend(environment.RESEND_API_KEY);
  const email = buildEmail(notification);
  const { data, error } = await resend.emails.send({
    from: environment.RESEND_FROM_EMAIL,
    to: [notification.email],
    subject: email.subject,
    text: email.text,
  }, {
    idempotencyKey: notification.event_key,
  });

  if (error) {
    const deliveryError = new Error(error.message || 'Email provider request failed.');
    deliveryError.status = error.statusCode;
    throw deliveryError;
  }
  if (!data?.id) throw new Error('Email provider did not return a message ID.');
  return { id: data.id };
};

const enqueueDueReminders = async (database, now = new Date()) => {
  const result = await database.query(`
    INSERT INTO appointment_notifications (
      appointment_id, customer_id, notification_type, event_key
    )
    SELECT a.id, a.customer_id, 'reminder_24h', 'reminder-24h:' || a.id::text
    FROM appointments a
    WHERE a.status IN ('pending', 'confirmed')
      AND a.start_time > $1
      AND a.start_time <= $1 + INTERVAL '24 hours'
    ON CONFLICT DO NOTHING
    RETURNING id
  `, [now]);
  return result.rows.length;
};

const enqueueStatusTransition = (client, appointment, previousStatus, nextStatus) => {
  if (!appointment || previousStatus === nextStatus) {
    throw new Error('A notification requires a persisted appointment status transition.');
  }
  const eventKey = `status:${appointment.id}:${previousStatus}:${nextStatus}`;
  return client.query(`
    INSERT INTO appointment_notifications (
      appointment_id, customer_id, notification_type,
      previous_status, next_status, event_key
    )
    VALUES ($1, $2, 'status_transition', $3, $4, $5)
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id
  `, [appointment.id, appointment.customer_id, previousStatus, nextStatus, eventKey]);
};

const enqueueStaffBooking = (client, appointment) => {
  if (!appointment?.id || !appointment?.staff_id) {
    throw new Error('A staff booking notification requires a persisted appointment and staff member.');
  }
  return client.query(`
    INSERT INTO staff_appointment_notifications (appointment_id, staff_id, event_key)
    VALUES ($1, $2, $3)
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id
  `, [appointment.id, appointment.staff_id, `booking:${appointment.id}`]);
};

const claimNotification = database => database.withTransaction(async client => {
  const result = await client.query(`
    SELECT n.id, n.appointment_id, n.customer_id, n.notification_type,
           n.previous_status, n.next_status, n.event_key, n.attempts, n.created_at,
           c.email,
           a.status AS current_appointment_status, a.start_time,
           service.name_en AS service_name, brand.name AS brand_name
    FROM appointment_notifications n
    JOIN customers c ON c.id = n.customer_id
    JOIN appointments a ON a.id = n.appointment_id
    JOIN services service ON service.id = a.service_id
    JOIN brands brand ON brand.id = a.brand_id
    WHERE (
        (n.delivery_status = 'queued' AND n.next_attempt_at <= NOW())
          OR (n.delivery_status = 'sending' AND n.locked_until <= NOW())
        )
    ORDER BY n.next_attempt_at, n.id
    LIMIT 1
    FOR UPDATE OF n SKIP LOCKED
  `, []);
  const notification = result.rows[0];
  if (!notification) return null;

  if (!notification.email || !result.rows[0].email) {
    await client.query(
      `UPDATE appointment_notifications
       SET delivery_status = 'skipped', last_error = 'Customer email is unavailable.',
           locked_until = NULL
       WHERE id = $1`,
      [notification.id]
    );
    return { skipped: true };
  }
  const preferenceResult = await client.query(
    'SELECT email_enabled FROM customer_notification_preferences WHERE customer_id = $1',
    [notification.customer_id]
  );
  if (!preferenceResult.rows[0]?.email_enabled) {
    await client.query(
      `UPDATE appointment_notifications
       SET delivery_status = 'skipped', last_error = 'Customer email notifications are disabled.',
           locked_until = NULL
       WHERE id = $1`,
      [notification.id]
    );
    return { skipped: true };
  }
  if (notification.notification_type === 'reminder_24h'
      && !['pending', 'confirmed'].includes(notification.current_appointment_status)) {
    await client.query(
      `UPDATE appointment_notifications
       SET delivery_status = 'skipped', last_error = 'Appointment is no longer active.',
           locked_until = NULL
       WHERE id = $1`,
      [notification.id]
    );
    return { skipped: true };
  }

  await client.query(`
    UPDATE appointment_notifications
    SET delivery_status = 'sending', attempts = attempts + 1,
        locked_until = NOW() + INTERVAL '2 minutes'
    WHERE id = $1
  `, [notification.id]);
  return { ...notification, attempts: Number(notification.attempts) + 1 };
});

const claimStaffNotification = database => database.withTransaction(async client => {
  const result = await client.query(`
    SELECT n.id, n.appointment_id, n.staff_id, n.event_key, n.attempts, n.created_at,
           staff.email, customer.full_name AS customer_name,
           a.start_time, service.name_en AS service_name, brand.name AS brand_name
    FROM staff_appointment_notifications n
    JOIN staff ON staff.id = n.staff_id
    JOIN appointments a ON a.id = n.appointment_id
    JOIN customers customer ON customer.id = a.customer_id
    JOIN services service ON service.id = a.service_id
    JOIN brands brand ON brand.id = a.brand_id
    WHERE staff.email IS NOT NULL
      AND (
        (n.delivery_status = 'queued' AND n.next_attempt_at <= NOW())
        OR (n.delivery_status = 'sending' AND n.locked_until <= NOW())
      )
    ORDER BY n.next_attempt_at, n.id
    LIMIT 1
    FOR UPDATE OF n SKIP LOCKED
  `, []);
  const notification = result.rows[0];
  if (!notification) return null;

  await client.query(`
    UPDATE staff_appointment_notifications
    SET delivery_status = 'sending', attempts = attempts + 1,
        locked_until = NOW() + INTERVAL '2 minutes'
    WHERE id = $1
  `, [notification.id]);
  return { ...notification, notification_type: 'service_booked', attempts: Number(notification.attempts) + 1 };
});

const updateDelivery = (database, notificationId, query, params) =>
  database.query(query, [...params, notificationId]);

const deliverOne = async (database, provider = sendWithResend, now = () => Date.now()) => {
  let notification = await claimNotification(database);
  while (notification?.skipped) notification = await claimNotification(database);
  if (!notification) return false;

  try {
    const providerResult = await provider(notification);
    await updateDelivery(database, notification.id, `
      UPDATE appointment_notifications
      SET delivery_status = 'sent', provider_message_id = $1, sent_at = NOW(),
          locked_until = NULL, last_error = NULL
      WHERE id = $2 AND delivery_status = 'sending'
    `, [providerResult.id]);
  } catch (error) {
    const ageMs = now() - new Date(notification.created_at).getTime();
    const retryable = !(error instanceof NotificationConfigurationError)
      && (!error.status || error.status === 429 || error.status >= 500);
    const canRetry = retryable && notification.attempts < MAX_ATTEMPTS
      && ageMs < MAX_IDEMPOTENCY_AGE_MS;
    const delayMinutes = Math.min(60, 2 ** notification.attempts);
    const safeError = error instanceof NotificationConfigurationError
      ? 'Email notification provider is not configured.'
      : error.status
        ? `Email provider returned HTTP ${error.status}.`
        : 'Email provider request failed.';
    await updateDelivery(database, notification.id, `
      UPDATE appointment_notifications
      SET delivery_status = $1,
          next_attempt_at = CASE WHEN $1 = 'queued'
            THEN NOW() + ($2::text || ' minutes')::interval ELSE next_attempt_at END,
          locked_until = NULL, last_error = $3
      WHERE id = $4 AND delivery_status = 'sending'
    `, [canRetry ? 'queued' : 'failed', delayMinutes, safeError]);
  }
  return true;
};

const deliverOneStaff = async (database, provider = sendWithResend, now = () => Date.now()) => {
  if (provider === sendWithResend && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)) {
    return false;
  }
  const notification = await claimStaffNotification(database);
  if (!notification) return false;

  try {
    const providerResult = await provider(notification);
    await updateDelivery(database, notification.id, `
      UPDATE staff_appointment_notifications
      SET delivery_status = 'sent', provider_message_id = $1, sent_at = NOW(),
          locked_until = NULL, last_error = NULL
      WHERE id = $2 AND delivery_status = 'sending'
    `, [providerResult.id]);
  } catch (error) {
    const ageMs = now() - new Date(notification.created_at).getTime();
    const retryable = !(error instanceof NotificationConfigurationError)
      && (!error.status || error.status === 429 || error.status >= 500);
    const canRetry = retryable && notification.attempts < MAX_ATTEMPTS
      && ageMs < MAX_IDEMPOTENCY_AGE_MS;
    const delayMinutes = Math.min(60, 2 ** notification.attempts);
    const safeError = error instanceof NotificationConfigurationError
      ? 'Email notification provider is not configured.'
      : error.status
        ? `Email provider returned HTTP ${error.status}.`
        : 'Email provider request failed.';
    await updateDelivery(database, notification.id, `
      UPDATE staff_appointment_notifications
      SET delivery_status = $1,
          next_attempt_at = CASE WHEN $1 = 'queued'
            THEN NOW() + ($2::text || ' minutes')::interval ELSE next_attempt_at END,
          locked_until = NULL, last_error = $3
      WHERE id = $4 AND delivery_status = 'sending'
    `, [canRetry ? 'queued' : 'failed', delayMinutes, safeError]);
  }
  return true;
};

const processNotifications = async (database, provider, now) => {
  await enqueueDueReminders(database);
  let delivered = 0;
  for (let index = 0; index < 25; index += 1) {
    const customerDelivered = await deliverOne(database, provider, now);
    const staffDelivered = await deliverOneStaff(database, provider, now);
    if (!customerDelivered && !staffDelivered) break;
    delivered += Number(customerDelivered) + Number(staffDelivered);
  }
  return delivered;
};

const startNotificationWorker = (database, options = {}) => {
  const pollIntervalMs = Number(process.env.NOTIFICATION_POLL_INTERVAL_MS) || 30_000;
  const provider = options.provider || sendWithResend;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processNotifications(database, provider);
    } catch (error) {
      console.error('Notification worker failed:', error.message);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(tick, pollIntervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
};

module.exports = {
  MAX_ATTEMPTS,
  NotificationConfigurationError,
  buildEmail,
  sendWithResend,
  enqueueDueReminders,
  enqueueStatusTransition,
  enqueueStaffBooking,
  claimStaffNotification,
  deliverOne,
  deliverOneStaff,
  processNotifications,
  startNotificationWorker,
};
