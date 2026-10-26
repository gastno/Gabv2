BEGIN;

ALTER TABLE appointment_notifications
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_unread_customer
    ON appointment_notifications(customer_id, created_at DESC, id DESC)
    WHERE is_read = FALSE;

COMMIT;
