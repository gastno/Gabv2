BEGIN;

ALTER TABLE staff_availabilities
    ADD COLUMN IF NOT EXISTS location TEXT
        CHECK (location IS NULL OR (length(btrim(location)) BETWEEN 1 AND 500));

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS is_alternate_location BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE appointments appointment
SET location = brand.location
FROM brands brand
WHERE brand.id = appointment.brand_id AND appointment.location IS NULL;

ALTER TABLE appointments ALTER COLUMN location SET NOT NULL;

COMMIT;
