DO $$
BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'accepted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending';
