const BOOKING_TIME_ZONE = 'Europe/Reykjavik';

const validateAvailabilityQuery = query => {
  const serviceId = Number(query.service_id);
  const staffId = query.staff_id === undefined ? null : Number(query.staff_id);
  const date = query.date;
  if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
    return { error: 'A valid service_id is required.' };
  }
  if (staffId !== null && (!Number.isSafeInteger(staffId) || staffId <= 0)) {
    return { error: 'staff_id must be a positive integer.' };
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: 'date must be an Iceland-local date in YYYY-MM-DD format.' };
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) {
    return { error: 'date must be a valid calendar date.' };
  }
  return { value: { serviceId, staffId, date } };
};

const getAvailability = (database, { serviceId, staffId, date }) => database.query(`
  SELECT DISTINCT
    staff_member.id AS staff_id,
    staff_member.full_name AS staff_name,
    target.brand_id,
    slot.start_time,
    slot.start_time + make_interval(mins => target.duration_minutes) AS end_time
  FROM services target
  JOIN staff_services assignment ON assignment.service_id = target.id
  JOIN staff staff_member ON staff_member.id = assignment.staff_id AND staff_member.is_active = TRUE
  JOIN staff_brands brand_assignment
    ON brand_assignment.staff_id = staff_member.id AND brand_assignment.brand_id = target.brand_id
  JOIN staff_availabilities availability
    ON availability.staff_id = staff_member.id
    AND availability.availability_date = $2::date
    AND availability.is_active = TRUE
  CROSS JOIN LATERAL generate_series(
    ((availability.availability_date + availability.start_time) AT TIME ZONE 'Atlantic/Reykjavik'),
    (((availability.availability_date + availability.end_time) AT TIME ZONE 'Atlantic/Reykjavik')
      - make_interval(mins => target.duration_minutes)),
    INTERVAL '15 minutes'
  ) AS slot(start_time)
  WHERE target.id = $1
    AND target.is_active = TRUE
    AND target.duration_minutes > 0
    AND ($3::bigint IS NULL OR staff_member.id = $3)
    AND slot.start_time >= NOW()
    AND NOT EXISTS (
      SELECT 1 FROM staff_unavailabilities unavailable
      WHERE unavailable.staff_id = staff_member.id
        AND unavailable.block_start < slot.start_time + make_interval(mins => target.duration_minutes)
        AND unavailable.block_end > slot.start_time
    )
    AND NOT EXISTS (
      SELECT 1 FROM appointments existing
      WHERE existing.staff_id = staff_member.id
        AND existing.status IN ('pending', 'confirmed')
        AND existing.start_time < slot.start_time + make_interval(mins => target.duration_minutes)
        AND existing.end_time > slot.start_time
    )
  ORDER BY staff_id, slot.start_time
`, [serviceId, date, staffId]);

module.exports = { BOOKING_TIME_ZONE, getAvailability, validateAvailabilityQuery };