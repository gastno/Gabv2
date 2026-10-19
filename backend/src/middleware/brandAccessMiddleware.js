const db = require('../config/db');
const MAX_POSTGRES_ID = 9223372036854775807n;

const isValidBrandId = id => (
  typeof id === 'string'
  && id.length <= 19
  && /^[1-9]\d*$/.test(id)
  && BigInt(id) <= MAX_POSTGRES_ID
);

const requireBrandAccess = async (req, res, next) => {
  const brandId = req.params.id;
  if (!isValidBrandId(brandId)) {
    return res.status(400).json({ error: 'Brand ID must be a positive integer.' });
  }

  try {
    const result = await db.query(
      `SELECT b.id
       FROM brands b
       WHERE b.id = $1
         AND ($2 = 'super_admin' OR EXISTS (
           SELECT 1
           FROM staff_brands sb
           WHERE sb.brand_id = b.id AND sb.staff_id = $3
         ))`,
      [brandId, req.user.role, req.user.id]
    );

    if (result.rows.length === 0) {
      const brandResult = await db.query('SELECT id FROM brands WHERE id = $1', [brandId]);
      if (brandResult.rows.length === 0) {
        return res.status(404).json({ error: 'Brand not found.' });
      }
      return res.status(403).json({ error: 'You do not have access to this brand.' });
    }

    return next();
  } catch (error) {
    console.error('Error checking brand access:', error);
    return res.status(500).json({ error: 'Failed to verify brand access.' });
  }
};

module.exports = { requireBrandAccess };
