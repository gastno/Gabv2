const db = require('../config/db');

const parseNotificationId = value => {
  if ((typeof value !== 'string' && typeof value !== 'number')
      || !/^[1-9]\d{0,18}$/.test(String(value))) return false;
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return false;
  try {
    return BigInt(value) <= 9223372036854775807n;
  } catch (error) {
    return false;
  }
};

const requireCustomer = (req, res) => {
  if (req.user?.type !== 'customer'
      || !Number.isSafeInteger(Number(req.user.id))
      || Number(req.user.id) <= 0) {
    res.status(403).json({ error: 'Customer account access is required.' });
    return false;
  }
  return true;
};

exports.getPreferences = async (req, res) => {
  if (!requireCustomer(req, res)) return;
  try {
    const result = await db.query(`
      SELECT COALESCE(
        (SELECT email_enabled FROM customer_notification_preferences WHERE customer_id = $1),
        FALSE
      ) AS email_enabled
    `, [req.user.id]);
    return res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error reading notification preferences:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve notification preferences.' });
  }
};

exports.updatePreferences = async (req, res) => {
  if (!requireCustomer(req, res)) return;
  if (typeof req.body?.email_enabled !== 'boolean') {
    return res.status(400).json({ error: 'email_enabled must be a boolean.' });
  }
  try {
    const result = await db.query(`
      INSERT INTO customer_notification_preferences (customer_id, email_enabled, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (customer_id) DO UPDATE
      SET email_enabled = EXCLUDED.email_enabled, updated_at = NOW()
      RETURNING email_enabled
    `, [req.user.id, req.body.email_enabled]);
    return res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error updating notification preferences:', error.message);
    return res.status(500).json({ error: 'Failed to update notification preferences.' });
  }
};

exports.listNotifications = async (req, res) => {
  if (!requireCustomer(req, res)) return;
  try {
    const result = await db.query(`
      SELECT n.id, n.appointment_id, n.notification_type,
             n.previous_status, n.next_status, n.delivery_status,
             n.last_error, n.created_at, n.sent_at, n.is_read,
             COUNT(*) FILTER (WHERE n.is_read = FALSE) OVER () AS unread_count,
             a.start_time, service.name_en AS service_name, brand.name AS brand_name
      FROM appointment_notifications n
      JOIN appointments a ON a.id = n.appointment_id
      JOIN services service ON service.id = a.service_id
      JOIN brands brand ON brand.id = a.brand_id
      WHERE n.customer_id = $1
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT 100
    `, [req.user.id]);
    return res.json({
      notifications: result.rows,
      unread_count: Number(result.rows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error('Error retrieving notification history:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve notification history.' });
  }
};

exports.markNotificationsRead = async (req, res) => {
  if (!requireCustomer(req, res)) return;
  const body = req.body;
  const keys = body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];
  const markAll = body?.all === true && keys.length === 1;
  const ids = body?.notification_ids;

  if (!markAll && (
    keys.length !== 1
    || keys[0] !== 'notification_ids'
    || !Array.isArray(ids)
    || ids.length < 1
    || ids.length > 100
    || !ids.every(parseNotificationId)
  )) {
    return res.status(400).json({
      error: 'Provide all: true or 1 to 100 valid notification_ids.',
    });
  }

  try {
    const values = markAll ? [req.user.id] : [req.user.id, ids];
    const target = markAll
      ? 'customer_id = $1 AND is_read = FALSE'
      : 'customer_id = $1 AND id = ANY($2::bigint[]) AND is_read = FALSE';
    const result = await db.query(`
      WITH updated AS (
        UPDATE appointment_notifications
        SET is_read = TRUE
        WHERE ${target}
        RETURNING id
      )
      SELECT
        COALESCE((SELECT array_agg(id) FROM updated), ARRAY[]::bigint[]) AS read_ids,
        (SELECT COUNT(*)::int FROM appointment_notifications
         WHERE customer_id = $1 AND is_read = FALSE) AS unread_count
    `, values);
    return res.json({
      read_ids: result.rows[0]?.read_ids || [],
      unread_count: Number(result.rows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error.message);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
};
