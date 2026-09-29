// src/controllers/serviceController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// 1. GET ALL SERVICES
exports.getAllServices = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        s.id,
        s.brand_id,
        s.category_id,
        s.name,
        s.description,
        s.duration_minutes,
        CONCAT(s.duration_minutes, ' min') AS duration,
        s.price_isk,
        CONCAT(TO_CHAR(s.price_isk, 'FM999,999,999'), ' kr') AS price,
        s.image_url,
        s.is_active,
        b.name AS brand,
        c.name AS category
      FROM services s
      JOIN brands b ON s.brand_id = b.id
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = TRUE
      ORDER BY s.id ASC;
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to retrieve services.' });
  }
};

// 2. CREATE SERVICE
exports.createService = async (req, res) => {
  const { 
    name, 
    description, 
    duration_minutes, 
    duration, 
    price_isk, 
    price, 
    brand_id, 
    brand, 
    category_id, 
    category,
    image_url
  } = req.body;

  let targetDuration = duration_minutes;
  if (!targetDuration && duration) {
    targetDuration = parseInt(duration.toString().replace(/\D/g, ''), 10);
  }

  let targetPrice = price_isk;
  if (!targetPrice && price) {
    targetPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
  }

  if (!name || !targetDuration || !targetPrice) {
    return res.status(400).json({ 
      error: 'Service name, duration (in minutes), and price (ISK) are required.' 
    });
  }

  try {
    let targetBrandId = brand_id;
    if (!targetBrandId && brand) {
      const brandRes = await db.query('SELECT id FROM brands WHERE name = $1', [brand]);
      if (brandRes.rows.length > 0) targetBrandId = brandRes.rows[0].id;
    }
    if (!targetBrandId) targetBrandId = 1;

    let targetCategoryId = category_id;
    if (!targetCategoryId && category) {
      const catRes = await db.query('SELECT id FROM categories WHERE name = $1 AND brand_id = $2', [category, targetBrandId]);
      if (catRes.rows.length > 0) targetCategoryId = catRes.rows[0].id;
    }

    if (!targetCategoryId) {
      return res.status(400).json({ error: 'A valid category_id or category name is required.' });
    }

    const queryText = `
      INSERT INTO services (brand_id, category_id, name, description, duration_minutes, price_isk, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, brand_id, category_id, name, description, duration_minutes, price_isk, image_url, is_active;
    `;

    const values = [
      targetBrandId,
      targetCategoryId,
      name,
      description || null,
      targetDuration,
      targetPrice,
      image_url || null
    ];

    const result = await db.query(queryText, values);

    res.status(201).json({
      message: 'Service created successfully',
      service: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service.' });
  }
};

// 3. UPDATE SERVICE
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    duration_minutes, 
    duration, 
    price_isk, 
    price, 
    brand_id, 
    category_id, 
    image_url,
    is_active 
  } = req.body;

  let targetDuration = duration_minutes;
  if (!targetDuration && duration) {
    targetDuration = parseInt(duration.toString().replace(/\D/g, ''), 10);
  }

  let targetPrice = price_isk;
  if (!targetPrice && price) {
    targetPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
  }

  try {
    const checkResult = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const queryText = `
      UPDATE services
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          duration_minutes = COALESCE($3, duration_minutes),
          price_isk = COALESCE($4, price_isk),
          brand_id = COALESCE($5, brand_id),
          category_id = COALESCE($6, category_id),
          image_url = COALESCE($7, image_url),
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING id, brand_id, category_id, name, description, duration_minutes, price_isk, image_url, is_active;
    `;

    const values = [
      name,
      description,
      targetDuration,
      targetPrice,
      brand_id,
      category_id,
      image_url,
      is_active,
      id
    ];

    const result = await db.query(queryText, values);

    res.json({
      message: 'Service updated successfully',
      service: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service.' });
  }
};

// 4. UPLOAD SERVICE IMAGE (POST /api/services/:id/image)
exports.uploadServiceImage = async (req, res) => {
  try {
    const serviceId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const uploadDir = path.join(__dirname, '../../../uploads', 'services');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);
    const dbRelativeUrl = `/uploads/services/${filename}`;

    await sharp(req.file.buffer)
      .resize(600, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(filepath);

    const currentService = await db.query('SELECT image_url FROM services WHERE id = $1', [serviceId]);

    if (currentService.rows.length === 0) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return res.status(404).json({ error: 'Service not found.' });
    }

    const oldImageUrl = currentService.rows[0].image_url;

    const updateResult = await db.query(
      'UPDATE services SET image_url = $1 WHERE id = $2 RETURNING id, name, price_isk, image_url',
      [dbRelativeUrl, serviceId]
    );

    if (oldImageUrl && oldImageUrl.startsWith('/uploads/services/')) {
      const oldFilePath = path.join(__dirname, '../../../', oldImageUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    return res.status(200).json({
      message: 'Service image uploaded successfully.',
      service: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error uploading service image:', error);
    return res.status(500).json({ error: error.message || 'Server error while uploading image.' });
  }
};