// src/controllers/staffServicesController.js
const db = require('../config/db');

// 1. GET ALL SERVICES ASSIGNED TO A SPECIFIC STAFF MEMBER
exports.getStaffServices = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);

  if (isNaN(staffId)) {
    return res.status(400).json({ error: 'Invalid staff ID parameter.' });
  }

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

// 2. BULK SYNC SERVICES FOR A STAFF MEMBER (Replaces current assignments with new service_ids array)
exports.syncStaffServices = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);
  const { service_ids } = req.body;

  if (isNaN(staffId)) {
    return res.status(400).json({ error: 'Invalid staff ID parameter.' });
  }

  if (!Array.isArray(service_ids)) {
    return res.status(400).json({ error: 'service_ids must be an array of numbers.' });
  }

  // Deduplicate and filter valid integer IDs
  const numericServiceIds = [...new Set(
    service_ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id))
  )];

  try {
    // Verify staff member exists
    const staffCheck = await db.query('SELECT id FROM staff WHERE id = $1', [staffId]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    await db.query('BEGIN');

    // Wipe existing service assignments
    await db.query('DELETE FROM staff_services WHERE staff_id = $1', [staffId]);

    // Insert new service assignments
    for (const serviceId of numericServiceIds) {
      await db.query(
        `INSERT INTO staff_services (staff_id, service_id) 
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [staffId, serviceId]
      );
    }

    await db.query('COMMIT');

    res.json({
      message: 'Staff services updated successfully.',
      staff_id: staffId,
      assigned_service_ids: numericServiceIds,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error syncing staff services:', error);
    res.status(500).json({ error: 'Failed to update staff service assignments.' });
  }
};

// 3. ASSIGN A SINGLE SERVICE TO A STAFF MEMBER
exports.assignService = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);
  const serviceId = parseInt(req.params.serviceId, 10);

  if (isNaN(staffId) || isNaN(serviceId)) {
    return res.status(400).json({ error: 'Invalid parameters.' });
  }

  try {
    const queryText = `
      INSERT INTO staff_services (staff_id, service_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;

    await db.query(queryText, [staffId, serviceId]);

    res.status(201).json({
      message: 'Service assigned to staff member successfully.',
      assignment: { staff_id: staffId, service_id: serviceId }
    });
  } catch (error) {
    console.error('Error assigning service:', error);
    res.status(500).json({ error: 'Failed to assign service.' });
  }
};

// 4. REMOVE A SINGLE SERVICE FROM A STAFF MEMBER
exports.removeService = async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10);
  const serviceId = parseInt(req.params.serviceId, 10);

  if (isNaN(staffId) || isNaN(serviceId)) {
    return res.status(400).json({ error: 'Invalid parameters.' });
  }

  try {
    const queryText = `
      DELETE FROM staff_services 
      WHERE staff_id = $1 AND service_id = $2
      RETURNING *;
    `;

    const result = await db.query(queryText, [staffId, serviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    res.json({
      message: 'Service assignment removed successfully.',
      removed: { staff_id: staffId, service_id: serviceId }
    });
  } catch (error) {
    console.error('Error removing staff service:', error);
    res.status(500).json({ error: 'Failed to remove service assignment.' });
  }
};

// 5. GET ALL STAFF MEMBERS ASSOCIATED WITH A SPECIFIC SERVICE
exports.getStaffByService = async (req, res) => {
  const serviceId = parseInt(req.params.serviceId, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ error: 'Invalid service ID parameter.' });
  }

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
    res.status(500).json({ error: 'Failed to retrieve staff members for service.' });
  }
};