CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TABLE IF NOT EXISTS staff_availabilities (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    availability_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT staff_availabilities_valid_window CHECK (end_time > start_time),
    CONSTRAINT staff_availabilities_no_overlapping_shifts EXCLUDE USING gist (
        staff_id WITH =,
        availability_date WITH =,
        (tsrange(availability_date + start_time, availability_date + end_time, '[)')) WITH &&
    ) WHERE (is_active)
);

CREATE INDEX IF NOT EXISTS idx_staff_availabilities_staff_date
    ON staff_availabilities(staff_id, availability_date);