const sharp = require('sharp');

const MIME_FORMATS = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

class ReferenceImageError extends Error {}

const processReferenceImage = async file => {
  const expectedFormat = MIME_FORMATS[file.mimetype];
  if (!expectedFormat) {
    throw new ReferenceImageError('Reference images must be JPEG, PNG, or WebP files.');
  }

  let image;
  try {
    image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (metadata.format !== expectedFormat) {
      throw new ReferenceImageError('The reference image content does not match its file type.');
    }

    let pipeline = image
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true });
    if (expectedFormat === 'jpeg') pipeline = pipeline.jpeg({ quality: 85 });
    if (expectedFormat === 'png') pipeline = pipeline.png({ compressionLevel: 9 });
    if (expectedFormat === 'webp') pipeline = pipeline.webp({ quality: 85 });

    return {
      buffer: await pipeline.toBuffer(),
      mimeType: file.mimetype,
    };
  } catch (error) {
    if (error instanceof ReferenceImageError) throw error;
    throw new ReferenceImageError('A reference image could not be decoded. Upload a valid JPEG, PNG, or WebP image.');
  }
};

module.exports = { ReferenceImageError, processReferenceImage };
