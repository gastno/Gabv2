const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const MAX_POSTGRES_ID = 9223372036854775807n;
const isPositiveId = id => {
  if (typeof id === 'number') return Number.isSafeInteger(id) && id > 0;
  return typeof id === 'string'
    && id.length <= 19
    && /^[1-9]\d*$/.test(id)
    && BigInt(id) <= MAX_POSTGRES_ID;
};
const layouts = [
  { id: 'grid', name: 'Classic grid' },
  { id: 'masonry', name: 'Masonry grid' },
  { id: 'mosaic', name: 'Mixed-size grid' },
  { id: 'feature', name: 'Featured image grid' },
  { id: 'carousel', name: 'Carousel' },
];
const layoutIds = new Set(layouts.map(layout => layout.id));
const uploadDirectory = path.join(__dirname, '../../../uploads', 'brands');

const parseBrandId = id => (isPositiveId(id) ? String(id) : null);

const saveBrandImage = async (file, kind) => {
  const sharpOptions = { limitInputPixels: 40000000 };
  let metadata;
  try {
    metadata = await sharp(file.buffer, sharpOptions).metadata();
  } catch (error) {
    const invalidImageError = new Error('Uploaded file is not a valid image.');
    invalidImageError.code = 'INVALID_IMAGE';
    throw invalidImageError;
  }
  if (!metadata.width || !metadata.height) {
    const invalidImageError = new Error('Uploaded file is not a valid image.');
    invalidImageError.code = 'INVALID_IMAGE';
    throw invalidImageError;
  }

  await fs.promises.mkdir(uploadDirectory, { recursive: true });
  const filename = `${uuidv4()}.webp`;
  const filepath = path.join(uploadDirectory, filename);
  const fit = kind === 'cover' ? 'cover' : 'inside';
  const dimensions = kind === 'cover'
    ? { width: 1800, height: 900 }
    : { width: 1800, height: 1800 };

  try {
    await sharp(file.buffer, sharpOptions)
      .rotate()
      .resize({ ...dimensions, fit, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filepath);
  } catch (error) {
    try {
      await fs.promises.unlink(filepath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Failed to remove incomplete brand image:', cleanupError);
      }
    }
    throw error;
  }

  return { url: `/uploads/brands/${filename}` };
};

const removeBrandImageFile = async imageUrl => {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/brands/')) return;
  const filename = path.basename(imageUrl);
  if (filename !== imageUrl.slice('/uploads/brands/'.length)) return;

  try {
    await fs.promises.unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove replaced brand image:', error);
    }
  }
};

const getPortfolio = async brandId => {
  const result = await db.query(
    `SELECT b.id, b.gallery_layout,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', p.id::text,
                  'image_url', p.image_url,
                  'display_order', p.display_order
                ) ORDER BY p.display_order ASC, p.id ASC
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'::json
            ) AS images
     FROM brands b
     LEFT JOIN brand_portfolio_images p ON p.brand_id = b.id
     WHERE b.id = $1
     GROUP BY b.id`,
    [brandId]
  );
  if (result.rows.length === 0) return null;

  return {
    brand_id: result.rows[0].id,
    layout: result.rows[0].gallery_layout,
    available_layouts: layouts,
    images: result.rows[0].images,
  };
};

exports.getAllBrands = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, location,
              COALESCE(description_en, about_description) AS about_description,
              description_en, description_is, cover_image_url, gallery_layout, updated_at
       FROM brands
       ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to retrieve brands.' });
  }
};

exports.getBrandPortfolio = async (req, res) => {
  const brandId = parseBrandId(req.params.id);
  if (!brandId) return res.status(400).json({ error: 'Brand ID must be a positive integer.' });

  try {
    const portfolio = await getPortfolio(brandId);
    if (!portfolio) return res.status(404).json({ error: 'Brand not found.' });
    return res.json(portfolio);
  } catch (error) {
    console.error('Error fetching brand portfolio:', error);
    return res.status(500).json({ error: 'Failed to retrieve brand portfolio.' });
  }
};

exports.updateBrand = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const fields = ['name', 'location', 'about_description', 'description_en', 'description_is'];
  const suppliedFields = fields.filter(field => Object.hasOwn(body, field));

  if (suppliedFields.length === 0) {
    return res.status(400).json({ error: 'At least one brand field must be provided.' });
  }
  if (suppliedFields.some(field => body[field] !== null && typeof body[field] !== 'string')) {
    return res.status(400).json({ error: 'Brand fields must be strings or null.' });
  }
  if (['name', 'location'].some(field => Object.hasOwn(body, field) && !body[field]?.trim())) {
    return res.status(400).json({ error: 'Brand name and location cannot be empty.' });
  }

  try {
    const result = await db.query(
      `UPDATE brands
       SET name = CASE WHEN $1 THEN $2 ELSE name END,
           location = CASE WHEN $3 THEN $4 ELSE location END,
           description_en = CASE WHEN $5 THEN $6 WHEN $9 THEN $10 ELSE description_en END,
           description_is = CASE WHEN $7 THEN $8 ELSE description_is END,
           about_description = CASE
             WHEN $5 OR $9 THEN CASE WHEN $5 THEN $6 ELSE $10 END
             ELSE about_description
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING id, name, slug, location, about_description,
                 description_en, description_is, logo_url,
                 cover_image_url, gallery_layout, updated_at`,
      [
        Object.hasOwn(body, 'name'), body.name ?? null,
        Object.hasOwn(body, 'location'), body.location ?? null,
        Object.hasOwn(body, 'description_en'), body.description_en ?? null,
        Object.hasOwn(body, 'description_is'), body.description_is ?? null,
        Object.hasOwn(body, 'about_description'), body.about_description ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Brand not found.' });
    return res.json({ message: 'Brand updated successfully', brand: result.rows[0] });
  } catch (error) {
    console.error('Error updating brand:', error);
    return res.status(500).json({ error: 'Failed to update brand.' });
  }
};

exports.uploadBrandImage = async (kind, req, res) => {
  const brandId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });

  let savedImage;
  try {
    savedImage = await saveBrandImage(req.file, kind);
    const column = kind === 'logo' ? 'logo_url' : 'cover_image_url';
    const updated = await db.withTransaction(async client => {
      const brandResult = await client.query(
        `SELECT ${column} AS image_url FROM brands WHERE id = $1 FOR UPDATE`,
        [brandId]
      );
      if (brandResult.rows.length === 0) return null;

      const result = await client.query(
        `UPDATE brands
         SET ${column} = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, ${column}`,
        [savedImage.url, brandId]
      );
      return { brand: result.rows[0], oldImageUrl: brandResult.rows[0].image_url };
    });
    if (!updated) {
      await removeBrandImageFile(savedImage.url);
      return res.status(404).json({ error: 'Brand not found.' });
    }

    await removeBrandImageFile(updated.oldImageUrl);
    return res.json({ message: `Brand ${kind} image uploaded successfully.`, brand: updated.brand });
  } catch (error) {
    if (error.code === 'INVALID_IMAGE') {
      return res.status(400).json({ error: error.message });
    }
    if (savedImage) await removeBrandImageFile(savedImage.url);
    console.error(`Error uploading brand ${kind} image:`, error);
    return res.status(500).json({ error: `Failed to upload brand ${kind} image.` });
  }
};

exports.uploadPortfolioImage = async (req, res) => {
  const brandId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });

  let savedImage;
  try {
    savedImage = await saveBrandImage(req.file, 'portfolio');
    const image = await db.withTransaction(async client => {
      const brandResult = await client.query(
        'SELECT id FROM brands WHERE id = $1 FOR UPDATE',
        [brandId]
      );
      if (brandResult.rows.length === 0) return null;

      const result = await client.query(
        `INSERT INTO brand_portfolio_images (brand_id, image_url, display_order)
         SELECT $1, $2, COALESCE(MAX(display_order) + 1, 0)
         FROM brand_portfolio_images
         WHERE brand_id = $1
         RETURNING id, image_url, display_order`,
        [brandId, savedImage.url]
      );
      await client.query(
        'UPDATE brands SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [brandId]
      );
      return result.rows[0];
    });

    if (!image) {
      await removeBrandImageFile(savedImage.url);
      return res.status(404).json({ error: 'Brand not found.' });
    }

    return res.status(201).json({ message: 'Portfolio image uploaded successfully.', image });
  } catch (error) {
    if (error.code === 'INVALID_IMAGE') {
      return res.status(400).json({ error: error.message });
    }
    if (savedImage) await removeBrandImageFile(savedImage.url);
    console.error('Error uploading portfolio image:', error);
    return res.status(500).json({ error: 'Failed to upload portfolio image.' });
  }
};

exports.deletePortfolioImage = async (req, res) => {
  if (!isPositiveId(req.params.imageId)) {
    return res.status(400).json({ error: 'Image ID must be a positive integer.' });
  }

  try {
    const deletedImage = await db.withTransaction(async client => {
      const brandResult = await client.query(
        'SELECT id FROM brands WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );
      if (brandResult.rows.length === 0) return null;

      const result = await client.query(
        `DELETE FROM brand_portfolio_images
         WHERE id = $1 AND brand_id = $2
         RETURNING id, image_url`,
        [req.params.imageId, req.params.id]
      );
      if (result.rows.length === 0) return false;

      await client.query(
        'UPDATE brands SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [req.params.id]
      );
      return result.rows[0];
    });
    if (!deletedImage) {
      return res.status(404).json({
        error: deletedImage === null ? 'Brand not found.' : 'Portfolio image not found.',
      });
    }

    await removeBrandImageFile(deletedImage.image_url);
    return res.json({ message: 'Portfolio image deleted successfully.', id: deletedImage.id });
  } catch (error) {
    console.error('Error deleting portfolio image:', error);
    return res.status(500).json({ error: 'Failed to delete portfolio image.' });
  }
};

exports.updatePortfolio = async (req, res) => {
  const { layout, image_ids: imageIds } = req.body || {};
  if (!layoutIds.has(layout)) {
    return res.status(400).json({
      error: 'Unsupported portfolio layout.',
      available_layouts: layouts,
    });
  }
  if (!Array.isArray(imageIds) || imageIds.some(id => !isPositiveId(id))) {
    return res.status(400).json({ error: 'image_ids must be an array of unique positive integer IDs.' });
  }
  const normalizedImageIds = imageIds.map(String);
  if (new Set(normalizedImageIds).size !== normalizedImageIds.length) {
    return res.status(400).json({ error: 'image_ids must be an array of unique positive integer IDs.' });
  }

  try {
    const updated = await db.withTransaction(async client => {
      const brandResult = await client.query(
        'SELECT id FROM brands WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );
      if (brandResult.rows.length === 0) return { notFound: true };

      const currentResult = await client.query(
        `SELECT id
         FROM brand_portfolio_images
         WHERE brand_id = $1
         ORDER BY display_order ASC, id ASC
         FOR UPDATE`,
        [req.params.id]
      );
      const currentIds = currentResult.rows.map(row => String(row.id));
      if (currentIds.length !== normalizedImageIds.length
          || currentIds.some(id => !normalizedImageIds.includes(id))) {
        return { invalidImages: true };
      }

      await client.query(
        'UPDATE brands SET gallery_layout = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [layout, req.params.id]
      );

      for (let index = 0; index < normalizedImageIds.length; index += 1) {
        await client.query(
          'UPDATE brand_portfolio_images SET display_order = $1 WHERE id = $2 AND brand_id = $3',
          [index, normalizedImageIds[index], req.params.id]
        );
      }

      return { notFound: false, invalidImages: false };
    });

    if (updated.notFound) return res.status(404).json({ error: 'Brand not found.' });
    if (updated.invalidImages) {
      return res.status(400).json({ error: 'image_ids must contain every portfolio image for this brand exactly once.' });
    }

    return res.json(await getPortfolio(req.params.id));
  } catch (error) {
    console.error('Error updating brand portfolio:', error);
    return res.status(500).json({ error: 'Failed to update brand portfolio.' });
  }
};
