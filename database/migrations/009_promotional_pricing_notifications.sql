BEGIN;

ALTER TABLE services
    ADD COLUMN IF NOT EXISTS sale_price_isk DECIMAL(12, 2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_valid_sale_price'
    ) THEN
        ALTER TABLE services
            ADD CONSTRAINT services_valid_sale_price
            CHECK (sale_price_isk IS NULL OR (sale_price_isk >= 0 AND sale_price_isk < price_isk));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS customer_notification_preferences (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_notifications (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    notification_type VARCHAR(32) NOT NULL
        CHECK (notification_type IN ('status_transition', 'reminder_24h')),
    previous_status appointment_status,
    next_status appointment_status,
    event_key VARCHAR(200) NOT NULL UNIQUE,
    delivery_status VARCHAR(16) NOT NULL DEFAULT 'queued'
        CHECK (delivery_status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    last_error TEXT,
    provider_message_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    CONSTRAINT appointment_notifications_valid_event CHECK (
        (notification_type = 'status_transition'
            AND previous_status IS NOT NULL
            AND next_status IS NOT NULL
            AND previous_status <> next_status)
        OR
        (notification_type = 'reminder_24h'
            AND previous_status IS NULL
            AND next_status IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_notification_reminder
    ON appointment_notifications(appointment_id)
    WHERE notification_type = 'reminder_24h';

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_delivery
    ON appointment_notifications(delivery_status, next_attempt_at, locked_until)
    WHERE delivery_status IN ('queued', 'sending');

COMMIT;
