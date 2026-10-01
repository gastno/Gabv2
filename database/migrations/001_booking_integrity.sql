CREATE EXTENSION IF NOT EXISTS "btree_gist";

DO $$
DECLARE
    duplicate_customer_groups TEXT;
    overlapping_appointments TEXT;
    invalid_appointments TEXT;
    invalid_unavailabilities TEXT;
    invalid_schedules TEXT;
    invalid_relationships TEXT;
    invalid_services TEXT;
BEGIN
    SELECT string_agg(array_to_string(customer_ids, ','), '; ' ORDER BY customer_ids::text)
    INTO duplicate_customer_groups
    FROM (
        SELECT array_agg(id ORDER BY id) AS customer_ids
        FROM customers
        GROUP BY regexp_replace(kennitala, '[^0-9]', '', 'g')
        HAVING count(*) > 1
    ) duplicates;

    IF duplicate_customer_groups IS NOT NULL THEN
        RAISE EXCEPTION 'Kennitala duplicates must be manually reconciled before migration; customer ID groups: %',
            duplicate_customer_groups;
    END IF;

    SELECT string_agg(format('%s/%s', appointment_ids[1], appointment_ids[2]), '; ')
    INTO overlapping_appointments
    FROM (
        SELECT ARRAY[a.id, b.id] AS appointment_ids
        FROM appointments a
        JOIN appointments b ON b.staff_id = a.staff_id AND b.id > a.id
        WHERE a.status IN ('pending', 'confirmed')
          AND b.status IN ('pending', 'confirmed')
          AND a.start_time < b.end_time
          AND b.start_time < a.end_time
        LIMIT 25
    ) overlap_pairs;

    IF overlapping_appointments IS NOT NULL THEN
        RAISE EXCEPTION 'Overlapping active appointments must be manually reconciled before migration; ID pairs: %',
            overlapping_appointments;
    END IF;

    SELECT string_agg(id::text, ', ' ORDER BY id) INTO invalid_appointments
    FROM appointments WHERE end_time <= start_time OR duration_snapshot_minutes <= 0;
    IF invalid_appointments IS NOT NULL THEN
        RAISE EXCEPTION 'Invalid appointment windows must be manually reconciled; appointment IDs: %', invalid_appointments;
    END IF;

    SELECT string_agg(id::text, ', ' ORDER BY id) INTO invalid_unavailabilities
    FROM staff_unavailabilities WHERE block_end <= block_start;
    IF invalid_unavailabilities IS NOT NULL THEN
        RAISE EXCEPTION 'Invalid unavailable periods must be manually reconciled; unavailability IDs: %', invalid_unavailabilities;
    END IF;

    SELECT string_agg(id::text, ', ' ORDER BY id) INTO invalid_schedules
    FROM staff_schedules WHERE shift_end <= shift_start;
    IF invalid_schedules IS NOT NULL THEN
        RAISE EXCEPTION 'Overnight or invalid schedules need manual adjustment before migration; schedule IDs: %', invalid_schedules;
    END IF;

    SELECT string_agg(id::text, ', ' ORDER BY id) INTO invalid_services
    FROM services WHERE duration_minutes <= 0 OR price_isk < 0;
    IF invalid_services IS NOT NULL THEN
        RAISE EXCEPTION 'Services with invalid booking duration/price need manual adjustment; service IDs: %', invalid_services;
    END IF;

    SELECT string_agg(a.id::text, ', ' ORDER BY a.id) INTO invalid_relationships
    FROM appointments a
    LEFT JOIN services s ON s.id = a.service_id AND s.brand_id = a.brand_id
    LEFT JOIN staff_brands sb ON sb.staff_id = a.staff_id AND sb.brand_id = a.brand_id
    WHERE s.id IS NULL OR sb.staff_id IS NULL;
    IF invalid_relationships IS NOT NULL THEN
        RAISE EXCEPTION 'Appointments with mismatched service/staff brands need manual reconciliation; appointment IDs: %',
            invalid_relationships;
    END IF;
END $$;

DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'appointments' AND column_name = 'start_time')
        = 'timestamp without time zone' THEN
        ALTER TABLE appointments ALTER COLUMN start_time TYPE TIMESTAMPTZ
            USING start_time AT TIME ZONE 'Atlantic/Reykjavik';
    END IF;
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'appointments' AND column_name = 'end_time')
        = 'timestamp without time zone' THEN
        ALTER TABLE appointments ALTER COLUMN end_time TYPE TIMESTAMPTZ
            USING end_time AT TIME ZONE 'Atlantic/Reykjavik';
    END IF;
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'staff_unavailabilities' AND column_name = 'block_start')
        = 'timestamp without time zone' THEN
        ALTER TABLE staff_unavailabilities ALTER COLUMN block_start TYPE TIMESTAMPTZ
            USING block_start AT TIME ZONE 'Atlantic/Reykjavik';
    END IF;
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'staff_unavailabilities' AND column_name = 'block_end')
        = 'timestamp without time zone' THEN
        ALTER TABLE staff_unavailabilities ALTER COLUMN block_end TYPE TIMESTAMPTZ
            USING block_end AT TIME ZONE 'Atlantic/Reykjavik';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_kennitala_digits
    ON customers (regexp_replace(kennitala, '[^0-9]', '', 'g'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_services_id_brand ON services (id, brand_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_valid_duration') THEN
        ALTER TABLE services ADD CONSTRAINT services_valid_duration CHECK (duration_minutes > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_valid_price') THEN
        ALTER TABLE services ADD CONSTRAINT services_valid_price CHECK (price_isk >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_valid_time_window') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_valid_time_window CHECK (end_time > start_time);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_valid_duration') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_valid_duration CHECK (duration_snapshot_minutes > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_unavailabilities_valid_window') THEN
        ALTER TABLE staff_unavailabilities ADD CONSTRAINT staff_unavailabilities_valid_window CHECK (block_end > block_start);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_schedules_valid_window') THEN
        ALTER TABLE staff_schedules ADD CONSTRAINT staff_schedules_valid_window CHECK (shift_end > shift_start);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_service_brand_fk') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_service_brand_fk
            FOREIGN KEY (service_id, brand_id) REFERENCES services(id, brand_id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_staff_brand_fk') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_staff_brand_fk
            FOREIGN KEY (staff_id, brand_id) REFERENCES staff_brands(staff_id, brand_id) ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
DECLARE
    overlapping_appointments TEXT;
BEGIN
        SELECT string_agg(format('%s/%s', overlap_ids[1], overlap_ids[2]), '; ')
    INTO overlapping_appointments
        FROM (
                SELECT ARRAY[a.id, b.id] AS overlap_ids
                FROM appointments a
                JOIN appointments b ON b.staff_id = a.staff_id AND b.id > a.id
                WHERE a.status IN ('pending', 'confirmed')
                    AND b.status IN ('pending', 'confirmed')
                    AND tstzrange(a.start_time, a.end_time, '[)') && tstzrange(b.start_time, b.end_time, '[)')
                LIMIT 25
        ) overlap_pairs;

    IF overlapping_appointments IS NOT NULL THEN
        RAISE EXCEPTION 'Active booking overlap prevents exclusion constraint; appointment ID pairs: %',
            overlapping_appointments;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_active_no_overlap') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_active_no_overlap
            EXCLUDE USING gist (
                staff_id WITH =,
                (tstzrange(start_time, end_time, '[)')) WITH &&
            ) WHERE (status IN ('pending', 'confirmed'));
    END IF;
END $$;