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
        s.email,
        s.description_en,
        s.description_is,
        s.description_en AS description,
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
        AND r.name = 'staff'
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
    email,
    description, 
    description_en,
    description_is,
    brand_ids, 
    photo 
  } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;
  if (email != null && typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid staff email address is required when provided.' });
  }
  const staffEmail = email == null || email.trim() === '' ? null : email.trim();

  if (!targetUsername || !password || !staffName) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }
  if (staffEmail && (staffEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail))) {
    return res.status(400).json({ error: 'A valid staff email address is required when provided.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let avatarUrl = photo || null;
    if (req.file) {
      avatarUrl = await processAndSaveAvatar(req.file.buffer);
    }

    const insertStaffQuery = `
      INSERT INTO staff (role_id, username, password_hash, full_name, email, description_en, description_is, avatar_url)
      SELECT r.id, $1, $2, $3, $4, $5, $6, $7
      FROM roles r
      WHERE r.name = 'staff'
      RETURNING id, role_id, username, full_name, email, description_en, description_is, avatar_url;
    `;

    const newStaff = await db.withTransaction(async client => {
      const staffResult = await client.query(insertStaffQuery, [
        targetUsername,
        hashedPassword,
        staffName,
        staffEmail,
        description_en ?? description ?? null,
        description_is || null,
        avatarUrl
      ]);

      const createdStaff = staffResult.rows[0];
      if (!createdStaff) {
        const error = new Error('Staff role is not configured.');
        error.code = 'STAFF_ROLE_NOT_CONFIGURED';
        throw error;
      }

      let parsedBrandIds = [];
      if (typeof brand_ids === 'string') {
        try { parsedBrandIds = JSON.parse(brand_ids); } catch (e) { parsedBrandIds = [1]; }
      } else if (Array.isArray(brand_ids) && brand_ids.length > 0) {
        parsedBrandIds = brand_ids;
      } else {
        parsedBrandIds = [1];
      }

      for (const bId of parsedBrandIds) {
        await client.query(
          `INSERT INTO staff_brands (staff_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [createdStaff.id, bId]
        );
      }

      return { ...createdStaff, brand_ids: parsedBrandIds };
    });

    res.status(201).json({
      message: 'Staff account created successfully',
      staff: {
        id: newStaff.id,
        role_id: newStaff.role_id,
        username: newStaff.username,
        full_name: newStaff.full_name,
        email: newStaff.email,
        description_en: newStaff.description_en,
        description_is: newStaff.description_is,
        description: newStaff.description_en,
        avatar_url: newStaff.avatar_url,
        brand_ids: newStaff.brand_ids,
      },
    });
  } catch (error) {
    console.error('Error creating staff account:', error);

    if (error.code === 'STAFF_ROLE_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Staff role is not configured.' });
    }

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
    email,
    description, 
    description_en,
    description_is,
    brand_ids 
  } = req.body;

  const targetUsername = username || userId;
  const staffName = full_name || name;
  const emailProvided = Object.prototype.hasOwnProperty.call(req.body || {}, 'email');
  if (emailProvided && email != null && typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid staff email address is required when provided.' });
  }
  const staffEmail = email == null || email.trim() === '' ? null : email.trim();
  if (emailProvided && staffEmail
      && (staffEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail))) {
    return res.status(400).json({ error: 'A valid staff email address is required when provided.' });
  }

  try {
    const checkResult = await db.query(
      `SELECT s.*
       FROM staff s
       JOIN roles r ON r.id = s.role_id
       WHERE s.id = $1 AND r.name = 'staff'`,
      [id]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const currentStaff = checkResult.rows[0];
    let newAvatarUrl = currentStaff.avatar_url;

    if (req.file) {
      newAvatarUrl = await processAndSaveAvatar(req.file.buffer);
      removeOldAvatarFile(currentStaff.avatar_url);
    }

    const englishDescription = description_en ?? description;
    const isNewPasswordProvided = password && password.trim() !== '' && !password.includes('•');

    await db.withTransaction(async client => {
      if (isNewPasswordProvided) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await client.query(
          `UPDATE staff
           SET username = COALESCE($1, username),
               full_name = COALESCE($2, full_name),
               description_en = COALESCE($3, description_en),
               description_is = COALESCE($4, description_is),
               avatar_url = $5,
               password_hash = $6,
               email = CASE WHEN $7 THEN $8 ELSE email END
           WHERE id = $9
             AND role_id = (SELECT id FROM roles WHERE name = 'staff')`,
          [targetUsername, staffName, englishDescription, description_is, newAvatarUrl, hashedPassword, emailProvided, staffEmail, id]
        );
      } else {
        await client.query(
          `UPDATE staff
           SET username = COALESCE($1, username),
               full_name = COALESCE($2, full_name),
               description_en = COALESCE($3, description_en),
               description_is = COALESCE($4, description_is),
               avatar_url = $5,
               email = CASE WHEN $6 THEN $7 ELSE email END
           WHERE id = $8
             AND role_id = (SELECT id FROM roles WHERE name = 'staff')`,
          [targetUsername, staffName, englishDescription, description_is, newAvatarUrl, emailProvided, staffEmail, id]
        );
      }

      let parsedBrandIds = brand_ids;
      if (typeof brand_ids === 'string') {
        try { parsedBrandIds = JSON.parse(brand_ids); } catch (e) { parsedBrandIds = null; }
      }

      if (Array.isArray(parsedBrandIds)) {
        await client.query('DELETE FROM staff_brands WHERE staff_id = $1', [id]);
        for (const bId of parsedBrandIds) {
          await client.query(
            'INSERT INTO staff_brands (staff_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, bId]
          );
        }
      }
    });

    res.json({ message: 'Staff account updated successfully' });
  } catch (error) {
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

    const currentStaffResult = await db.query(
      `SELECT s.avatar_url
       FROM staff s
       JOIN roles r ON r.id = s.role_id
       WHERE s.id = $1 AND r.name = 'staff'`,
      [staffId]
    );

    if (currentStaffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const oldAvatarUrl = currentStaffResult.rows[0].avatar_url;
    const dbRelativeUrl = await processAndSaveAvatar(req.file.buffer);

    const updateResult = await db.query(
      `UPDATE staff
       SET avatar_url = $1
       WHERE id = $2
         AND role_id = (SELECT id FROM roles WHERE name = 'staff')
       RETURNING id, username, full_name, description_en, description_is, avatar_url`,
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