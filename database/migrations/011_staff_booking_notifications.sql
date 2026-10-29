BEGIN;

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE TABLE IF NOT EXISTS staff_appointment_notifications (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    event_key VARCHAR(200) NOT NULL UNIQUE,
    delivery_status VARCHAR(16) NOT NULL DEFAULT 'queued'
        CHECK (delivery_status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    last_error TEXT,
    provider_message_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_appointment_notifications_delivery
    ON staff_appointment_notifications(delivery_status, next_attempt_at, locked_until)
    WHERE delivery_status IN ('queued', 'sending');
CREATE INDEX IF NOT EXISTS idx_staff_appointment_notifications_unread
    ON staff_appointment_notifications(staff_id, created_at DESC, id DESC)
    WHERE is_read = FALSE;

COMMIT;
