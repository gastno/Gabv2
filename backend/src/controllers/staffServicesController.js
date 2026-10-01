// src/controllers/staffServicesController.js
const db = require('../config/db');

// 1. GET ALL SERVICES ASSIGNED TO A SPECIFIC STAFF MEMBER
exports.getStaffServices = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);
  if (isNaN(staffId)) return res.status(400).json({ error: 'Invalid staff ID parameter.' });

  try {
    const queryText = `
      SELECT 
        s.id AS service_id,
        s.name AS service_name,
        s.duration_minutes,
        s.price_isk,
        s.image_url,
        c.name AS category_name,
        b.name AS brand_name
      FROM staff_services ss
      JOIN services s ON ss.service_id = s.id
      JOIN categories c ON s.category_id = c.id
      JOIN brands b ON s.brand_id = b.id
      WHERE ss.staff_id = $1 AND s.is_active = TRUE
      ORDER BY s.id ASC;
    `;
    const result = await db.query(queryText, [staffId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff services:', error);
    res.status(500).json({ error: 'Failed to retrieve services for staff member.' });
  }
};

// 2. GET ALL STAFF MEMBERS ASSOCIATED WITH A SPECIFIC SERVICE
exports.getStaffByService = async (req, res) => {
  const serviceId = parseInt(req.params.serviceId, 10);
  if (isNaN(serviceId)) return res.status(400).json({ error: 'Invalid service ID parameter.' });

  try {
    const queryText = `
      SELECT 
        s.id,
        s.username,
        s.full_name AS name,
        s.description,
        s.is_active,
        COALESCE(s.avatar_url, '/placeholder-person-1.jpg') AS avatar_url,
        r.name AS role,
        s.role_id
      FROM staff_services ss
      JOIN staff s ON ss.staff_id = s.id
      JOIN roles r ON s.role_id = r.id
      WHERE ss.service_id = $1 AND s.is_active = TRUE
      ORDER BY s.id ASC;
    `;
    const result = await db.query(queryText, [serviceId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff for service:', error);
    res.status(500).json({ error: 'Failed to retrieve staff members.' });
  }
};

// 3. BULK SYNC SERVICES FOR A STAFF MEMBER
exports.syncStaffServices = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);
  const { service_ids } = req.body;
  if (isNaN(staffId)) return res.status(400).json({ error: 'Invalid staff ID.' });
  if (!Array.isArray(service_ids)) return res.status(400).json({ error: 'service_ids must be an array.' });

  const numericIds = [...new Set(service_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))];

  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM staff_services WHERE staff_id = $1', [staffId]);
    for (const serviceId of numericIds) {
      await db.query(
        `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [staffId, serviceId]
      );
    }
    await db.query('COMMIT');
    res.json({ message: 'Staff services updated.', staff_id: staffId, assigned_service_ids: numericIds });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to sync staff services.' });
  }
};

// 4. BULK SYNC STAFF WORKERS FOR A SPECIFIC SERVICE (NEW)
exports.syncServiceWorkers = async (req, res) => {
  const serviceId = parseInt(req.params.serviceId, 10);
  const { staff_ids } = req.body;
  if (isNaN(serviceId)) return res.status(400).json({ error: 'Invalid service ID.' });
  if (!Array.isArray(staff_ids)) return res.status(400).json({ error: 'staff_ids must be an array.' });

  const numericIds = [...new Set(staff_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))];

  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM staff_services WHERE service_id = $1', [serviceId]);
    for (const staffId of numericIds) {
      await db.query(
        `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [staffId, serviceId]
      );
    }
    await db.query('COMMIT');
    res.json({ message: 'Service workers updated.', service_id: serviceId, assigned_staff_ids: numericIds });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to sync service workers.' });
  }
};

// 5. ASSIGN SINGLE ROW
exports.assignService = async (req, res) => {
  const { staffId, serviceId } = req.params;
  try {
    await db.query(
      `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *;`,
      [staffId, serviceId]
    );
    res.status(201).json({ message: 'Assigned successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign.' });
  }
};

// 6. REMOVE SINGLE ROW
exports.removeService = async (req, res) => {
  const { staffId, serviceId } = req.params;
  try {
    await db.query(`DELETE FROM staff_services WHERE staff_id = $1 AND service_id = $2 RETURNING *;`, [staffId, serviceId]);
    res.json({ message: 'Removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove.' });
  }
};