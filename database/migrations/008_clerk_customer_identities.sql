BEGIN;

CREATE TABLE IF NOT EXISTS customer_identities (
    provider VARCHAR(50) NOT NULL CHECK (provider = 'clerk'),
    provider_subject VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider, provider_subject),
    CONSTRAINT uq_customer_identities_provider_customer UNIQUE (provider, customer_id)
);

COMMIT;
