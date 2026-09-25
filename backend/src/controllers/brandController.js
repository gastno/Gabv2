// src/controllers/brandController.js
const db = require('../config/db');

// 1. Get all brands (matches exact table schema: id, name, slug, location, about_description, updated_at)
exports.getAllBrands = async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, slug, location, about_description, updated_at
      FROM brands
      ORDER BY id ASC;
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to retrieve brands.' });
  }
};

// 2. Update an existing brand (Only name, location, and about_description can be edited)
exports.updateBrand = async (req, res) => {
  const { id } = req.params;
  const { name, location, about_description } = req.body;

  try {
    // Check if brand exists
    const checkResult = await db.query('SELECT * FROM brands WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    const queryText = `
      UPDATE brands
      SET name = COALESCE($1, name),
          location = COALESCE($2, location),
          about_description = COALESCE($3, about_description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, slug, location, about_description, updated_at;
    `;

    const values = [name, location, about_description, id];
    const result = await db.query(queryText, values);

    res.json({
      message: 'Brand updated successfully',
      brand: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Failed to update brand.' });
  }
};