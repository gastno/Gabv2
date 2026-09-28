const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

// Resolves directory path to <root>/uploads/avatars
const getUploadDirectory = () => {
  return path.join(__dirname, '../../../uploads', 'avatars');
};

const processAndSaveAvatar = async (fileBuffer) => {
  const uploadDir = getUploadDirectory();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${uuidv4()}.webp`;
  const filepath = path.join(uploadDir, filename);
  const dbRelativeUrl = `/uploads/avatars/${filename}`;

  await sharp(fileBuffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(filepath);

  return dbRelativeUrl;
};

const removeOldAvatarFile = (avatarUrl) => {
  if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
    const filename = path.basename(avatarUrl);
    const targetFilePath = path.join(getUploadDirectory(), filename);
    if (fs.existsSync(targetFilePath)) {
      try {
        fs.unlinkSync(targetFilePath);
      } catch (err) {
        console.error('Failed to remove old avatar file:', err);
      }
    }
  }
};

// 1. GET ALL STAFF
exports.getAllStaff = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        s.id,
        s.username,
        s.full_name AS name,
        s.description,
        s.is_active,
        s.avatar_url,
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

// 2. CREATE STAFF ACCOUNT
exports.createStaff = async (req, res) => {
  const { 
    username, 
    userId, 
    password, 
    full_name, 
    name, 
    description, 
    brand_ids, 
    role_id,
    photo 
  } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;

  const parsedRoleId = role_id ? parseInt(role_id, 10) : 3;
  if (isNaN(parsedRoleId)) {
    return res.status(400).json({ error: 'role_id must be a valid integer.' });
  }

  if (!targetUsername || !password || !staffName) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let avatarUrl = photo || null;
    if (req.file) {
      avatarUrl = await processAndSaveAvatar(req.file.buffer);
    }

    await db.query('BEGIN');

    const insertStaffQuery = `
      INSERT INTO staff (role_id, username, password_hash, full_name, description, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, role_id, username, full_name, description, avatar_url;
    `;

    const staffResult = await db.query(insertStaffQuery, [
      parsedRoleId,
      targetUsername,
      hashedPassword,
      staffName,
      description || null,
      avatarUrl
    ]);

    const newStaff = staffResult.rows[0];

    let parsedBrandIds = [];
    if (typeof brand_ids === 'string') {
      try { parsedBrandIds = JSON.parse(brand_ids); } catch (e) { parsedBrandIds = [1]; }
    } else if (Array.isArray(brand_ids) && brand_ids.length > 0) {
      parsedBrandIds = brand_ids;
    } else {
      parsedBrandIds = [1];
    }

    for (const bId of parsedBrandIds) {
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
        avatar_url: newStaff.avatar_url,
        brand_ids: parsedBrandIds,
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

// 3. UPDATE STAFF ACCOUNT
exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { 
    username, 
    userId, 
    password, 
    full_name, 
    name, 
    description, 
    role_id, 
    brand_ids 
  } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;

  try {
    const checkResult = await db.query('SELECT * FROM staff WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const currentStaff = checkResult.rows[0];
    let newAvatarUrl = currentStaff.avatar_url;

    if (req.file) {
      newAvatarUrl = await processAndSaveAvatar(req.file.buffer);
      removeOldAvatarFile(currentStaff.avatar_url);
    }

    await db.query('BEGIN');

    const isNewPasswordProvided = password && password.trim() !== '' && !password.includes('•');

    if (isNewPasswordProvided) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await db.query(
        `UPDATE staff
         SET username = COALESCE($1, username),
             full_name = COALESCE($2, full_name),
             description = COALESCE($3, description),
             role_id = COALESCE($4, role_id),
             avatar_url = $5,
             password_hash = $6
         WHERE id = $7`,
        [targetUsername, staffName, description, role_id || currentStaff.role_id, newAvatarUrl, hashedPassword, id]
      );
    } else {
      await db.query(
        `UPDATE staff
         SET username = COALESCE($1, username),
             full_name = COALESCE($2, full_name),
             description = COALESCE($3, description),
             role_id = COALESCE($4, role_id),
             avatar_url = $5
         WHERE id = $6`,
        [targetUsername, staffName, description, role_id || currentStaff.role_id, newAvatarUrl, id]
      );
    }

    let parsedBrandIds = brand_ids;
    if (typeof brand_ids === 'string') {
      try { parsedBrandIds = JSON.parse(brand_ids); } catch (e) { parsedBrandIds = null; }
    }

    if (Array.isArray(parsedBrandIds)) {
      await db.query('DELETE FROM staff_brands WHERE staff_id = $1', [id]);
      for (const bId of parsedBrandIds) {
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

// 4. STANDALONE AVATAR UPLOAD
exports.uploadAvatar = async (req, res) => {
  try {
    const staffId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const currentStaffResult = await db.query('SELECT avatar_url FROM staff WHERE id = $1', [staffId]);

    if (currentStaffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const oldAvatarUrl = currentStaffResult.rows[0].avatar_url;
    const dbRelativeUrl = await processAndSaveAvatar(req.file.buffer);

    const updateResult = await db.query(
      'UPDATE staff SET avatar_url = $1 WHERE id = $2 RETURNING id, username, full_name, avatar_url',
      [dbRelativeUrl, staffId]
    );

    removeOldAvatarFile(oldAvatarUrl);

    return res.status(200).json({
      message: 'Staff avatar uploaded successfully.',
      staff: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error uploading staff avatar:', error);
    return res.status(500).json({ error: error.message || 'Server error while uploading avatar.' });
  }
};