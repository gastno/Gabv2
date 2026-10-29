const db = require('../config/db');

const isValidId = value => {
  if ((typeof value !== 'string' && typeof value !== 'number')
      || !/^[1-9]\d{0,18}$/.test(String(value))) return false;
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return false;
  try {
    return BigInt(value) <= 9223372036854775807n;
  } catch (error) {
    return false;
  }
};

const requireStaff = (req, res) => {
  if (req.user?.type !== 'staff'
      || !Number.isSafeInteger(Number(req.user.id))
      || Number(req.user.id) <= 0) {
    res.status(403).json({ error: 'Staff account access is required.' });
    return false;
  }
  return true;
};

exports.listNotifications = async (req, res) => {
  if (!requireStaff(req, res)) return;
  try {
    const result = await db.query(`
      SELECT n.id, n.appointment_id, n.delivery_status, n.last_error,
             n.created_at, n.sent_at, n.is_read,
             COUNT(*) FILTER (WHERE n.is_read = FALSE) OVER () AS unread_count,
             a.start_time, service.name_en AS service_name, brand.name AS brand_name
      FROM staff_appointment_notifications n
      JOIN appointments a ON a.id = n.appointment_id
      JOIN services service ON service.id = a.service_id
      JOIN brands brand ON brand.id = a.brand_id
      WHERE n.staff_id = $1
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT 100
    `, [req.user.id]);
    return res.json({
      notifications: result.rows,
      unread_count: Number(result.rows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error('Error retrieving staff notification history:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve staff notifications.' });
  }
};

exports.markNotificationsRead = async (req, res) => {
  if (!requireStaff(req, res)) return;
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
    || !ids.every(isValidId)
  )) {
    return res.status(400).json({ error: 'Provide all: true or 1 to 100 valid notification_ids.' });
  }

  try {
    const values = markAll ? [req.user.id] : [req.user.id, ids];
    const target = markAll
      ? 'staff_id = $1 AND is_read = FALSE'
      : 'staff_id = $1 AND id = ANY($2::bigint[]) AND is_read = FALSE';
    const result = await db.query(`
      WITH updated AS (
        UPDATE staff_appointment_notifications
        SET is_read = TRUE
        WHERE ${target}
        RETURNING id
      )
      SELECT
        COALESCE((SELECT array_agg(id) FROM updated), ARRAY[]::bigint[]) AS read_ids,
        (SELECT COUNT(*)::int FROM staff_appointment_notifications
         WHERE staff_id = $1 AND is_read = FALSE) AS unread_count
    `, values);
    return res.json({
      read_ids: result.rows[0]?.read_ids || [],
      unread_count: Number(result.rows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error('Error marking staff notifications as read:', error.message);
    return res.status(500).json({ error: 'Failed to mark staff notifications as read.' });
  }
};
