const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');


const SALT_ROUNDS = 10;

// 1. GET ALL STAFF (Aggregates assigned brands into an array)
exports.getAllStaff = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        s.id,
        s.username,
        s.full_name AS name,
        s.description,
        s.is_active,
        r.name AS role,
        s.role_id,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', b.id, 'name', b.name)
          ) FILTER (WHERE b.id IS NOT NULL), '[]'
        ) AS assigned_brands
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      LEFT JOIN staff_brands sb ON s.id = sb.staff_id
      LEFT JOIN brands b ON sb.brand_id = b.id
      WHERE s.is_active = TRUE
      GROUP BY s.id, r.name
      ORDER BY s.id ASC;
    `;

    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({ error: 'Failed to retrieve staff members.' });
  }
};

// 2. CREATE STAFF (Accepts brand_ids array)
exports.createStaff = async (req, res) => {
  const { username, userId, password, full_name, name, description, brand_ids, role_id } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;

  if (role_id === undefined || role_id === null || role_id === '') {
    return res.status(400).json({ error: 'role_id is required and cannot be omitted.' });
  }

  const parsedRoleId = parseInt(role_id, 10);
  if (!targetUsername || !password || !staffName) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.query('BEGIN');

    const insertStaffQuery = `
      INSERT INTO staff (role_id, username, password_hash, full_name, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, role_id, username, full_name, description;
    `;

    const staffResult = await db.query(insertStaffQuery, [
      parsedRoleId,
      targetUsername,
      hashedPassword,
      staffName,
      description || null,
    ]);

    const newStaff = staffResult.rows[0];

    // Handle multiple brands (default to brand [1] if empty or omitted)
    const targetBrandIds = Array.isArray(brand_ids) && brand_ids.length > 0 ? brand_ids : [1];

    for (const bId of targetBrandIds) {
      await db.query(
        `INSERT INTO staff_brands (staff_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [newStaff.id, bId]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({
      message: 'Staff account created successfully',
      staff: {
        id: newStaff.id,
        role_id: newStaff.role_id,
        username: newStaff.username,
        full_name: newStaff.full_name,
        description: newStaff.description,
        brand_ids: targetBrandIds,
      },
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating staff account:', error);

    if (error.code === '23505' && error.detail && error.detail.includes('username')) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    res.status(500).json({ error: 'Failed to create staff account.' });
  }
};

// 3. UPDATE STAFF (Re-syncs multi-brand associations)
exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { username, userId, password, full_name, name, description, role_id, brand_ids } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;

  try {
    const checkResult = await db.query('SELECT * FROM staff WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    await db.query('BEGIN');

    const isNewPasswordProvided = password && password.trim() !== '' && !password.includes('••');

    if (isNewPasswordProvided) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await db.query(
        `UPDATE staff
         SET username = COALESCE($1, username),
             full_name = COALESCE($2, full_name),
             description = COALESCE($3, description),
             role_id = COALESCE($4, role_id),
             password_hash = $5
         WHERE id = $6`,
        [targetUsername, staffName, description, role_id, hashedPassword, id]
      );
    } else {
      await db.query(
        `UPDATE staff
         SET username = COALESCE($1, username),
             full_name = COALESCE($2, full_name),
             description = COALESCE($3, description),
             role_id = COALESCE($4, role_id)
         WHERE id = $5`,
        [targetUsername, staffName, description, role_id, id]
      );
    }

    // Sync multi-brand associations if brand_ids was provided
    if (Array.isArray(brand_ids)) {
      await db.query('DELETE FROM staff_brands WHERE staff_id = $1', [id]);
      for (const bId of brand_ids) {
        await db.query(
          'INSERT INTO staff_brands (staff_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, bId]
        );
      }
    }

    await db.query('COMMIT');

    res.json({ message: 'Staff account updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating staff account:', error);
    res.status(500).json({ error: 'Failed to update staff account.' });
  }
};

// POST /api/staff/:id/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const staffId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // 1. Ensure target folder exists: ./uploads/avatars
    const uploadDir = path.join(__dirname, '../../../uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Generate unique filename and relative path for DB
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);
    const dbRelativeUrl = `/uploads/avatars/${filename}`;

    // 3. Process image with Sharp: crop to 400x400 square, convert to WebP
    await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(filepath);

    // 4. Retrieve current avatar_url to delete old image file if it exists
    const currentStaffResult = await pool.query('SELECT avatar_url FROM staff WHERE id = $1', [staffId]);

    if (currentStaffResult.rows.length === 0) {
      // Cleanup newly uploaded file if staff member doesn't exist
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const oldAvatarUrl = currentStaffResult.rows[0].avatar_url;

    // 5. Update database record with new relative path
    const updateResult = await pool.query(
      'UPDATE staff SET avatar_url = $1 WHERE id = $2 RETURNING id, username, full_name, avatar_url',
      [dbRelativeUrl, staffId]
    );

    // 6. Delete old avatar file from disk if present
    if (oldAvatarUrl) {
      const oldFilePath = path.join(__dirname, '../../../', oldAvatarUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    return res.status(200).json({
      message: 'Staff avatar uploaded successfully.',
      staff: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error uploading staff avatar:', error);
    return res.status(500).json({ error: error.message || 'Server error while uploading avatar.' });
  }
};