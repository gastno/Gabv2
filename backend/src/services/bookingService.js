class BookingError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const createBooking = (database, booking) => database.withTransaction(async client => {
  const serviceResult = await client.query(`
    SELECT s.brand_id, s.duration_minutes, s.price_isk
    FROM services s
    JOIN staff_services ss ON ss.service_id = s.id
    JOIN staff st ON st.id = ss.staff_id
    JOIN staff_brands sb ON sb.staff_id = st.id AND sb.brand_id = s.brand_id
    WHERE s.id = $1
      AND s.brand_id = $2
      AND st.id = $3
      AND s.is_active = TRUE
      AND st.is_active = TRUE
      AND s.duration_minutes > 0
      AND s.price_isk >= 0
    LIMIT 1
    FOR SHARE OF s, ss, st, sb
  `, [booking.serviceId, booking.brandId, booking.staffId]);

  if (serviceResult.rows.length === 0) {
    throw new BookingError('The service, brand, or staff selection is not bookable.', 422);
  }

  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`staff:${booking.staffId}`]);

  const service = serviceResult.rows[0];
  const durationMinutes = Number(service.duration_minutes);
  const priceIsk = Number(service.price_isk);
  if (!Number.isSafeInteger(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(priceIsk) || priceIsk < 0) {
    throw new BookingError('The selected service has invalid booking details.', 422);
  }

  const availabilityResult = await client.query(`
    WITH requested AS (
      SELECT $1::timestamptz AS start_time,
              $1::timestamptz + make_interval(mins => $3) AS end_time,
             $1::timestamptz AT TIME ZONE 'Atlantic/Reykjavik' AS local_start,
              ($1::timestamptz + make_interval(mins => $3)) AT TIME ZONE 'Atlantic/Reykjavik' AS local_end
    )
    SELECT EXISTS (
      SELECT 1
      FROM staff_availabilities availability
      CROSS JOIN requested booking_window
      WHERE availability.staff_id = $2
        AND availability.availability_date = booking_window.local_start::date
        AND availability.is_active = TRUE
        AND booking_window.local_start::time >= availability.start_time
        AND booking_window.local_end::date = booking_window.local_start::date
        AND booking_window.local_end::time <= availability.end_time
        AND MOD(EXTRACT(EPOCH FROM (booking_window.local_start - (availability.availability_date + availability.start_time)))::BIGINT, 900) = 0
        AND booking_window.start_time >= NOW()
        AND NOT EXISTS (
          SELECT 1 FROM staff_unavailabilities unavailable
          WHERE unavailable.staff_id = availability.staff_id
            AND unavailable.block_start < booking_window.end_time
            AND unavailable.block_end > booking_window.start_time
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments existing
          WHERE existing.staff_id = availability.staff_id
            AND existing.status IN ('pending', 'confirmed')
            AND existing.start_time < booking_window.end_time
            AND existing.end_time > booking_window.start_time
        )
    ) AS available
  `, [booking.startTime, booking.staffId, durationMinutes]);

  if (!availabilityResult.rows[0]?.available) {
    throw new BookingError('The selected time is not available in the staff schedule.', 409);
  }

  let customerId;
  if (booking.customerId) {
    const customerResult = await client.query(
      'SELECT id FROM customers WHERE id = $1 AND is_registered = TRUE FOR UPDATE',
      [booking.customerId]
    );
    if (customerResult.rows.length === 0) {
      throw new BookingError('The authenticated customer account is not available for booking.', 403);
    }
    customerId = customerResult.rows[0].id;
  } else {
    const kennitalaDigits = booking.kennitala.replace(/\D/g, '');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [kennitalaDigits]);
    const customerResult = await client.query(`
      SELECT id, is_registered
      FROM customers
      WHERE regexp_replace(kennitala, '[^0-9]', '', 'g') = $1
      ORDER BY is_registered DESC, id ASC
      LIMIT 1
      FOR UPDATE
    `, [kennitalaDigits]);

    if (customerResult.rows.length > 0) {
      if (customerResult.rows[0].is_registered) {
        throw new BookingError('Booking could not be completed for this identity.', 409);
      }
      customerId = customerResult.rows[0].id;
    } else {
      const customerInsert = await client.query(`
        INSERT INTO customers (full_name, phone_number, kennitala, health_info, consent_privacy, is_registered)
        VALUES ($1, $2, $3, $4, TRUE, FALSE)
        RETURNING id
      `, [booking.fullName, booking.phoneNumber, booking.kennitala, booking.healthInfo]);
      customerId = customerInsert.rows[0].id;
    }
  }

  const endTime = new Date(booking.startTime.getTime() + durationMinutes * 60_000);
  const appointmentResult = await client.query(`
    INSERT INTO appointments
      (brand_id, service_id, staff_id, customer_id, start_time, end_time,
       duration_snapshot_minutes, price_snapshot_isk, custom_options)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    service.brand_id,
    booking.serviceId,
    booking.staffId,
    customerId,
    booking.startTime,
    endTime,
    durationMinutes,
    priceIsk,
    booking.customOptions === null ? null : JSON.stringify(booking.customOptions),
  ]);

  return appointmentResult.rows[0];
});

module.exports = { BookingError, createBooking };