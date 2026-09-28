// src/controllers/categoryController.js
const db = require('../config/db');

// 1. GET ALL CATEGORIES (Joins brand name for frontend display)
exports.getAllCategories = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        c.id,
        c.brand_id,
        c.name AS title,
        c.description AS subtitle,
        b.name AS brand
      FROM categories c
      JOIN brands b ON c.brand_id = b.id
      ORDER BY c.id ASC;
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
};

// 2. CREATE CATEGORY (Admin/SuperAdmin only)
exports.createCategory = async (req, res) => {
  const { name, title, description, subtitle, brand_id, brand } = req.body;

  // Normalize field names sent from frontend or postman
  const categoryName = name || title;
  const categoryDesc = description || subtitle;

  if (!categoryName) {
    return res.status(400).json({ error: 'Category name/title is required.' });
  }

  try {
    let targetBrandId = brand_id;

    // Lookup brand_id by brand name if brand_id wasn't passed directly
    if (!targetBrandId && brand) {
      const brandRes = await db.query('SELECT id FROM brands WHERE name = $1', [brand]);
      if (brandRes.rows.length > 0) {
        targetBrandId = brandRes.rows[0].id;
      }
    }

    // Default to brand 1 if missing
    if (!targetBrandId) {
      targetBrandId = 1;
    }

    const queryText = `
      INSERT INTO categories (brand_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, brand_id, name AS title, description AS subtitle;
    `;

    const result = await db.query(queryText, [targetBrandId, categoryName, categoryDesc || null]);

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// 3. UPDATE CATEGORY (Admin/SuperAdmin only)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, title, description, subtitle, brand_id, brand } = req.body;

  const categoryName = name || title;
  const categoryDesc = description || subtitle;

  try {
    const checkResult = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    let targetBrandId = brand_id;
    if (!targetBrandId && brand) {
      const brandRes = await db.query('SELECT id FROM brands WHERE name = $1', [brand]);
      if (brandRes.rows.length > 0) {
        targetBrandId = brandRes.rows[0].id;
      }
    }

    const queryText = `
      UPDATE categories
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          brand_id = COALESCE($3, brand_id)
      WHERE id = $4
      RETURNING id, brand_id, name AS title, description AS subtitle;
    `;

    const result = await db.query(queryText, [categoryName, categoryDesc, targetBrandId, id]);

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};