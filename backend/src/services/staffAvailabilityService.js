const { isValidTimestamp } = require('./bookingContract');
const { BookingError } = require('./bookingService');

const clockSeconds = value => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0);
};

const isValidLocalDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeAvailabilityShifts = shifts => {
  if (!Array.isArray(shifts) || shifts.length > 20) {
    return { error: 'shifts must be an array with at most 20 shifts for one date.' };
  }

  const normalized = [];
  for (const shift of shifts) {
    const start = clockSeconds(shift?.start_time);
    const end = clockSeconds(shift?.end_time);
    if (start === null || end === null || end <= start) {
      return { error: 'Each shift requires a same-day start_time before end_time.' };
    }
    if (shift.is_active !== undefined && typeof shift.is_active !== 'boolean') {
      return { error: 'is_active must be a boolean.' };
    }
    normalized.push({
      startTime: `${shift.start_time.length === 5 ? `${shift.start_time}:00` : shift.start_time}`,
      endTime: `${shift.end_time.length === 5 ? `${shift.end_time}:00` : shift.end_time}`,
      isActive: shift.is_active ?? true,
      start,
      end,
    });
  }

  normalized.sort((left, right) => left.start - right.start);
  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (current.start < previous.end) {
      return { error: 'Shifts for the selected date must not overlap.' };
    }
  }

  return { value: normalized.map(({ startTime, endTime, isActive }) => ({
    startTime,
    endTime,
    isActive,
  })) };
};

const validateUnavailablePeriod = body => {
  if (!body || !isValidTimestamp(body.start_time) || !isValidTimestamp(body.end_time)) {
    return { error: 'start_time and end_time must be ISO 8601 timestamps with explicit timezone offsets.' };
  }
  if (new Date(body.end_time) <= new Date(body.start_time)) {
    return { error: 'end_time must be after start_time.' };
  }
  if (body.reason !== undefined && body.reason !== null
      && (typeof body.reason !== 'string' || body.reason.length > 255)) {
    return { error: 'reason must be a string of at most 255 characters.' };
  }
  return { value: {
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    reason: body.reason?.trim() || null,
  } };
};

const assertActiveStaff = async (client, staffId) => {
  const result = await client.query('SELECT id FROM staff WHERE id = $1 AND is_active = TRUE', [staffId]);
  if (!result.rows.length) throw new BookingError('Staff member is not active.', 404);
};

const lockStaffAvailability = (client, staffId) => client.query(
  'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
  [`staff:${staffId}`]
);

const getStaffAvailability = async (database, staffId, date) => {
  const [availability, unavailabilities] = await Promise.all([
    database.query(`
      SELECT id, availability_date, start_time, end_time, is_active
      FROM staff_availabilities
      WHERE staff_id = $1 AND availability_date = $2::date
      ORDER BY start_time
    `, [staffId, date]),
    database.query(`
      SELECT id, block_start, block_end, reason
      FROM staff_unavailabilities
      WHERE staff_id = $1
        AND block_start < (($2::date + TIME '00:00') AT TIME ZONE 'Atlantic/Reykjavik' + INTERVAL '1 day')
        AND block_end > (($2::date + TIME '00:00') AT TIME ZONE 'Atlantic/Reykjavik')
      ORDER BY block_start
      LIMIT 200
    `, [staffId, date]),
  ]);
  return { availability: availability.rows, unavailabilities: unavailabilities.rows };
};

const isStaffInAdminScope = async (database, staffId, brandId, actor) => {
  const result = await database.query(`
    SELECT 1
    FROM staff member
    WHERE member.id = $1
      AND member.is_active = TRUE
      AND ($2::bigint IS NULL OR EXISTS (
        SELECT 1 FROM staff_brands staff_scope
        WHERE staff_scope.staff_id = member.id AND staff_scope.brand_id = $2
      ))
      AND ($4::boolean = TRUE OR EXISTS (
        SELECT 1 FROM staff_brands admin_scope
        WHERE admin_scope.staff_id = $3 AND admin_scope.brand_id = $2
      ))
  `, [staffId, brandId, actor.id, actor.role === 'super_admin']);
  return result.rows.length > 0;
};

const replaceStaffAvailability = (database, staffId, date, shifts) => database.withTransaction(async client => {
  await assertActiveStaff(client, staffId);
  await lockStaffAvailability(client, staffId);
  const conflictingAppointment = await client.query(`
    SELECT 1
    FROM appointments appointment
    WHERE appointment.staff_id = $1
      AND appointment.status IN ('pending', 'confirmed')
      AND (appointment.start_time AT TIME ZONE 'Atlantic/Reykjavik')::date = $2::date
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_to_recordset($3::jsonb) AS shift(start_time TIME, end_time TIME, is_active BOOLEAN)
        WHERE shift.is_active = TRUE
          AND appointment.start_time >= (($2::date + shift.start_time) AT TIME ZONE 'Atlantic/Reykjavik')
          AND appointment.end_time <= (($2::date + shift.end_time) AT TIME ZONE 'Atlantic/Reykjavik')
      )
    LIMIT 1
  `, [staffId, date, JSON.stringify(shifts)]);
  if (conflictingAppointment.rows.length) {
    throw new BookingError('Availability changes would exclude an existing appointment.', 409);
  }

  await client.query('DELETE FROM staff_availabilities WHERE staff_id = $1 AND availability_date = $2::date', [staffId, date]);
  for (const shift of shifts) {
    await client.query(`
      INSERT INTO staff_availabilities (staff_id, availability_date, start_time, end_time, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `, [staffId, date, shift.startTime, shift.endTime, shift.isActive]);
  }
  return getStaffAvailability(client, staffId, date);
});

const addStaffUnavailability = (database, staffId, period) => database.withTransaction(async client => {
  await assertActiveStaff(client, staffId);
  await lockStaffAvailability(client, staffId);
  const appointments = await client.query(`
    SELECT 1 FROM appointments
    WHERE staff_id = $1
      AND status IN ('pending', 'confirmed')
      AND start_time < $3
      AND end_time > $2
    LIMIT 1
  `, [staffId, period.startTime, period.endTime]);
  if (appointments.rows.length) {
    throw new BookingError('Unavailable period overlaps an existing appointment.', 409);
  }
  const result = await client.query(`
    INSERT INTO staff_unavailabilities (staff_id, block_start, block_end, reason)
    VALUES ($1, $2, $3, $4)
    RETURNING id, block_start, block_end, reason
  `, [staffId, period.startTime, period.endTime, period.reason]);
  return result.rows[0];
});

const removeStaffUnavailability = (database, staffId, unavailabilityId) => database.withTransaction(async client => {
  await lockStaffAvailability(client, staffId);
  const result = await client.query(`
    DELETE FROM staff_unavailabilities
    WHERE id = $1 AND staff_id = $2
    RETURNING id
  `, [unavailabilityId, staffId]);
  return result.rows[0] || null;
});

module.exports = {
  addStaffUnavailability,
  getStaffAvailability,
  isStaffInAdminScope,
  isValidLocalDate,
  normalizeAvailabilityShifts,
  removeStaffUnavailability,
  replaceStaffAvailability,
  validateUnavailablePeriod,
};