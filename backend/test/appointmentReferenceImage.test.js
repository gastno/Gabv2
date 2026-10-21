const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { ReferenceImageError, processReferenceImage } = require('../src/services/appointmentReferenceImage');

test('validates, resizes, and preserves supported reference image formats', async () => {
  const source = await sharp({
    create: {
      width: 2400,
      height: 1200,
      channels: 3,
      background: '#123456',
    },
  }).png().toBuffer();

  const result = await processReferenceImage({
    buffer: source,
    mimetype: 'image/png',
  });
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(result.mimeType, 'image/png');
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 2048);
  assert.equal(metadata.height, 1024);
});

test('rejects file types that are not allowed or do not match their content', async () => {
  await assert.rejects(
    processReferenceImage({ buffer: Buffer.from('not an image'), mimetype: 'image/gif' }),
    ReferenceImageError
  );

  const png = await sharp({
    create: { width: 1, height: 1, channels: 3, background: '#123456' },
  }).png().toBuffer();
  await assert.rejects(
    processReferenceImage({ buffer: png, mimetype: 'image/jpeg' }),
    /does not match/
  );
});
