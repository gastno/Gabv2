// src/controllers/serviceController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class ServiceMutationError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const isValidPostgresId = value => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^[1-9]\d{0,18}$/.test(String(value))) {
    return false;
  }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return false;
  try {
    return BigInt(value) <= 9223372036854775807n;
  } catch (error) {
    return false;
  }
};

const parsePrice = value => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const raw = String(value).trim();
  const priceMatch = /^(?:ISK\s*)?((?:\d{1,3}(?:[,\s\u00a0\u202f]\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s*(?:kr|ISK))?$/i.exec(raw);
  if (!priceMatch) return NaN;
  const normalized = priceMatch[1].replace(/[,\s\u00a0\u202f]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
};

const canManageBrand = async (user, brandId, queryable = db) => {
  if (user?.type !== 'staff' || !['admin', 'super_admin'].includes(user.role)) return false;
  if (user.role === 'super_admin') return true;
  const access = await queryable.query(
    'SELECT 1 FROM staff_brands WHERE staff_id = $1 AND brand_id = $2 FOR KEY SHARE',
    [user.id, brandId]
  );
  return access.rows.length > 0;
};

// 1. GET ALL SERVICES
exports.getAllServices = async (req, res) => {
  try {
    const canViewInactive = req.user?.type === 'staff'
      && ['staff', 'admin', 'super_admin'].includes(req.user.role);
    const queryText = `
      SELECT 
        s.id,
        s.brand_id,
        s.category_id,
        s.name_en,
        s.name_is,
        s.description_en,
        s.description_is,
        s.name_en AS name,
        s.description_en AS description,
        s.duration_minutes,
        CONCAT(s.duration_minutes, ' min') AS duration,
        s.price_isk,
        s.sale_price_isk,
        CONCAT(TO_CHAR(s.price_isk, 'FM999,999,999'), ' kr') AS price,
        CASE WHEN s.sale_price_isk IS NULL THEN NULL
             ELSE CONCAT(TO_CHAR(s.sale_price_isk, 'FM999,999,999'), ' kr') END AS sale_price,
        s.image_url,
        s.is_active,
        b.name AS brand,
        c.name_en AS category,
        c.name_en AS category_en,
        c.name_is AS category_is
      FROM services s
      JOIN brands b ON s.brand_id = b.id
      JOIN categories c ON s.category_id = c.id
      WHERE ($1::boolean OR s.is_active = TRUE)
      ORDER BY s.id ASC;
    `;
    const result = await db.query(queryText, [canViewInactive]);
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
    name_en,
    name_is,
    description, 
    description_en,
    description_is,
    duration_minutes, 
    duration, 
    price_isk, 
    price, 
    sale_price_isk,
    brand_id, 
    brand, 
    category_id, 
    category,
    image_url,
    is_active
  } = req.body;

  let targetDuration = duration_minutes;
  if (!targetDuration && duration) {
    targetDuration = parseInt(duration.toString().replace(/\D/g, ''), 10);
  }

  const targetPrice = parsePrice(price_isk ?? price);
  const targetSalePrice = parsePrice(sale_price_isk);

  const serviceNameEn = name_en ?? name;
  const serviceDescriptionEn = description_en ?? description ?? null;

  if (!serviceNameEn || !Number.isSafeInteger(Number(targetDuration)) || Number(targetDuration) <= 0
      || targetPrice === null) {
    return res.status(400).json({ 
      error: 'Service name, duration (in minutes), and price (ISK) are required.' 
    });
  }
  if (Number.isNaN(targetPrice)) {
    return res.status(400).json({ error: 'price_isk must be a non-negative amount with up to two decimal places.' });
  }
  if (Number.isNaN(targetSalePrice) || (targetSalePrice !== null && targetSalePrice >= targetPrice)) {
    return res.status(400).json({ error: 'sale_price_isk must be empty or lower than the regular price.' });
  }
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be a boolean.' });
  }

  try {
    const queryText = `
      INSERT INTO services (brand_id, category_id, name_en, name_is, description_en, description_is, duration_minutes, price_isk, sale_price_isk, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, TRUE))
      RETURNING id, brand_id, category_id, name_en, name_is, description_en, description_is,
                name_en AS name, description_en AS description, duration_minutes, price_isk, sale_price_isk, image_url, is_active;
    `;

    const createdService = await db.withTransaction(async client => {
      let targetBrandId = brand_id;
      if (!targetBrandId && brand) {
        const brandResult = await client.query('SELECT id FROM brands WHERE name = $1 FOR KEY SHARE', [brand]);
        if (brandResult.rows.length > 0) targetBrandId = brandResult.rows[0].id;
      }
      if (!targetBrandId) targetBrandId = 1;
      if (!isValidPostgresId(targetBrandId)) {
        throw new ServiceMutationError('A valid brand_id is required.', 400);
      }
      if (!(await canManageBrand(req.user, targetBrandId, client))) {
        throw new ServiceMutationError('You do not have access to manage services for this brand.', 403);
      }

      let targetCategoryId = category_id;
      if (!targetCategoryId && category) {
        const categoryByName = await client.query(
          'SELECT id FROM categories WHERE (name_en = $1 OR name_is = $1) AND brand_id = $2',
          [category, targetBrandId]
        );
        if (categoryByName.rows.length > 0) targetCategoryId = categoryByName.rows[0].id;
      }
      if (!targetCategoryId) {
        throw new ServiceMutationError('A valid category_id or category name is required.', 400);
      }
      if (!isValidPostgresId(targetCategoryId)) {
        throw new ServiceMutationError('A valid category_id is required.', 400);
      }
      const categoryResult = await client.query(
        'SELECT 1 FROM categories WHERE id = $1 AND brand_id = $2 FOR KEY SHARE',
        [targetCategoryId, targetBrandId]
      );
      if (categoryResult.rows.length === 0) {
        throw new ServiceMutationError('The category must belong to the selected brand.', 400);
      }

      const values = [
        targetBrandId,
        targetCategoryId,
        serviceNameEn,
        name_is ?? null,
        serviceDescriptionEn,
        description_is ?? null,
        targetDuration,
        targetPrice,
        targetSalePrice,
        image_url || null,
        is_active ?? null,
      ];
      const result = await client.query(queryText, values);
      return result.rows[0];
    });

    res.status(201).json({
      message: 'Service created successfully',
      service: createdService,
    });
  } catch (error) {
    if (error instanceof ServiceMutationError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service.' });
  }
};

// 3. UPDATE SERVICE
exports.updateService = async (req, res) => {
  const { id } = req.params;
  if (!isValidPostgresId(id)) return res.status(400).json({ error: 'Invalid service ID.' });
  const {
    name,
    name_en,
    name_is,
    description,
    description_en,
    description_is,
    duration_minutes,
    duration,
    price_isk,
    price,
    sale_price_isk,
    brand_id,
    category_id,
    image_url,
    is_active,
  } = req.body;
  const serviceNameEn = name_en ?? name;
  const serviceDescriptionEn = description_en ?? description;

  try {
    const queryText = `
      UPDATE services
      SET name_en = COALESCE($1, name_en),
          name_is = COALESCE($2, name_is),
          description_en = COALESCE($3, description_en),
          description_is = COALESCE($4, description_is),
          duration_minutes = COALESCE($5, duration_minutes),
          price_isk = COALESCE($6, price_isk),
          sale_price_isk = CASE WHEN $7::boolean THEN $8::decimal ELSE sale_price_isk END,
          brand_id = COALESCE($9, brand_id),
          category_id = COALESCE($10, category_id),
          image_url = COALESCE($11, image_url),
          is_active = COALESCE($12, is_active)
      WHERE id = $13
      RETURNING id, brand_id, category_id, name_en, name_is, description_en, description_is,
                name_en AS name, description_en AS description, duration_minutes, price_isk, sale_price_isk, image_url, is_active;
    `;

    const updatedService = await db.withTransaction(async client => {
      const checkResult = await client.query(`
        SELECT id, brand_id, category_id, price_isk, sale_price_isk
        FROM services WHERE id = $1 FOR UPDATE
      `, [id]);
      const current = checkResult.rows[0];
      if (!current) throw new ServiceMutationError('Service not found.', 404);
      if (!(await canManageBrand(req.user, current.brand_id, client))) {
        throw new ServiceMutationError('You do not have access to manage this service.', 403);
      }

      const targetBrandId = brand_id ?? current.brand_id;
      const targetCategoryId = category_id ?? current.category_id;
      const targetDuration = duration_minutes ?? (duration
        ? parseInt(duration.toString().replace(/\D/g, ''), 10)
        : null);
      const targetPrice = parsePrice(price_isk ?? price);
      const targetSalePrice = Object.prototype.hasOwnProperty.call(req.body, 'sale_price_isk')
        ? parsePrice(sale_price_isk)
        : current.sale_price_isk;
      const nextBasePrice = targetPrice === null ? Number(current.price_isk) : targetPrice;

      if (!isValidPostgresId(targetBrandId) || !isValidPostgresId(targetCategoryId)) {
        throw new ServiceMutationError('A valid brand_id and category_id are required.', 400);
      }
      if (!(await canManageBrand(req.user, targetBrandId, client))) {
        throw new ServiceMutationError('You do not have access to manage services for this brand.', 403);
      }
      if (targetDuration !== null
          && (!Number.isSafeInteger(Number(targetDuration)) || Number(targetDuration) <= 0)) {
        throw new ServiceMutationError('duration_minutes must be a positive integer.', 400);
      }
      if (targetPrice !== null && Number.isNaN(targetPrice)) {
        throw new ServiceMutationError('price_isk must be a non-negative number.', 400);
      }
      if (Number.isNaN(targetSalePrice)
          || (targetSalePrice !== null && Number(targetSalePrice) >= nextBasePrice)) {
        throw new ServiceMutationError('sale_price_isk must be empty or lower than the regular price.', 400);
      }
      if (is_active !== undefined && typeof is_active !== 'boolean') {
        throw new ServiceMutationError('is_active must be a boolean.', 400);
      }
      const categoryResult = await client.query(
        'SELECT 1 FROM categories WHERE id = $1 AND brand_id = $2 FOR KEY SHARE',
        [targetCategoryId, targetBrandId]
      );
      if (categoryResult.rows.length === 0) {
        throw new ServiceMutationError('The category must belong to the selected brand.', 400);
      }

      const values = [
        serviceNameEn,
        name_is,
        serviceDescriptionEn,
        description_is,
        targetDuration,
        targetPrice,
        Object.prototype.hasOwnProperty.call(req.body, 'sale_price_isk'),
        targetSalePrice,
        targetBrandId,
        targetCategoryId,
        image_url,
        is_active,
        id,
      ];
      const result = await client.query(queryText, values);
      return result.rows[0];
    });

    res.json({
      message: 'Service updated successfully',
      service: updatedService,
    });
  } catch (error) {
    if (error instanceof ServiceMutationError) {
      return res.status(error.status).json({ error: error.message });
    }
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
    const currentServiceResult = await db.query(
      'SELECT brand_id, image_url FROM services WHERE id = $1',
      [serviceId]
    );
    const currentService = currentServiceResult.rows[0];
    if (!currentService) return res.status(404).json({ error: 'Service not found.' });
    if (!(await canManageBrand(req.user, currentService.brand_id))) {
      return res.status(403).json({ error: 'You do not have access to manage this service.' });
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

    const oldImageUrl = currentService.image_url;

    const updateResult = await db.query(
      'UPDATE services SET image_url = $1 WHERE id = $2 RETURNING id, name_en, name_is, name_en AS name, price_isk, image_url',
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