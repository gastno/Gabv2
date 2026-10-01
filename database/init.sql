-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Define Custom Enumerated Types
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE fee_status AS ENUM ('none', 'awaiting_fee', 'fee_charged', 'fee_waived');
CREATE TYPE system_role AS ENUM ('admin', 'staff', 'super_admin');

-- --------------------------------------------------------------------------
-- DOMAIN 1: TENANCY & AUTHENTICATION INFRASTRUCTURE
-- --------------------------------------------------------------------------

CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    location TEXT NOT NULL,
    about_description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name system_role NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE staff (
    id BIGSERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_brands (
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, brand_id)
);

-- --------------------------------------------------------------------------
-- DOMAIN 2: SERVICE CATALOG TOPOLOGY
-- --------------------------------------------------------------------------

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_categories_brand_name ON categories(brand_id, name);

CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price_isk DECIMAL(12,2) NOT NULL,
    image_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_services_id_brand UNIQUE (id, brand_id),
    CONSTRAINT services_valid_duration CHECK (duration_minutes > 0),
    CONSTRAINT services_valid_price CHECK (price_isk >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_services_brand_cat ON services(brand_id, category_id);

CREATE TABLE staff_services (
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, service_id)
);

-- --------------------------------------------------------------------------
-- DOMAIN 3: CUSTOMER DIRECTORY & TRANSACTIONAL LEDGER
-- --------------------------------------------------------------------------

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    kennitala VARCHAR(11) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    health_info TEXT,
    consent_privacy BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_customers_kennitala_digits
    ON customers (regexp_replace(kennitala, '[^0-9]', '', 'g'));
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_email ON customers(email);

CREATE TABLE customer_sessions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customer_sessions_token ON customer_sessions(customer_id, refresh_token_hash);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_snapshot_minutes INT NOT NULL,
    price_snapshot_isk DECIMAL(12,2) NOT NULL,
    custom_options JSONB,
    status appointment_status NOT NULL DEFAULT 'pending',
    fee_status fee_status NOT NULL DEFAULT 'none',
    row_version INT NOT NULL DEFAULT 1,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_valid_time_window CHECK (end_time > start_time),
    CONSTRAINT appointments_valid_duration CHECK (duration_snapshot_minutes > 0),
    CONSTRAINT appointments_service_brand_fk
        FOREIGN KEY (service_id, brand_id) REFERENCES services(id, brand_id) ON DELETE RESTRICT,
    CONSTRAINT appointments_staff_brand_fk
        FOREIGN KEY (staff_id, brand_id) REFERENCES staff_brands(staff_id, brand_id) ON DELETE RESTRICT,
    CONSTRAINT appointments_active_no_overlap EXCLUDE USING gist (
        staff_id WITH =,
        (tstzrange(start_time, end_time, '[)')) WITH &&
    ) WHERE (status IN ('pending', 'confirmed'))
);
CREATE INDEX idx_appointments_staff_time ON appointments(staff_id, start_time, end_time);
CREATE INDEX idx_appointments_customer_time ON appointments(customer_id, start_time);
CREATE INDEX idx_appointments_brand_status ON appointments(brand_id, status);

-- --------------------------------------------------------------------------
-- DOMAIN 4: AVAILABILITY & CALENDAR ENGINE
-- --------------------------------------------------------------------------

CREATE TABLE staff_availabilities (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    availability_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT staff_availabilities_valid_window CHECK (end_time > start_time),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT staff_availabilities_no_overlapping_shifts EXCLUDE USING gist (
        staff_id WITH =,
        availability_date WITH =,
        (tsrange(availability_date + start_time, availability_date + end_time, '[)')) WITH &&
    ) WHERE (is_active)
);
CREATE INDEX idx_staff_availabilities_staff_date ON staff_availabilities(staff_id, availability_date);

CREATE TABLE staff_unavailabilities (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    block_start TIMESTAMPTZ NOT NULL,
    block_end TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255),
    CONSTRAINT staff_unavailabilities_valid_window CHECK (block_end > block_start)
);
CREATE INDEX idx_staff_unavailabilities_time ON staff_unavailabilities(staff_id, block_start, block_end);