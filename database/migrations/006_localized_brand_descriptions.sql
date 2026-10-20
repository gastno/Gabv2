ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS description_en TEXT,
    ADD COLUMN IF NOT EXISTS description_is TEXT;

UPDATE brands
SET description_en = about_description
WHERE description_en IS NULL
  AND about_description IS NOT NULL;
