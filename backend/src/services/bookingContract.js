const BOOKING_TIME_ZONE = 'Europe/Reykjavik';
const TIMESTAMP_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const positiveId = value => {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const validTimestamp = value => {
  if (typeof value !== 'string' || !TIMESTAMP_WITH_OFFSET.test(value)) return false;

  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!dateParts) return false;
  const [, year, month, day, hour, minute, second = '0'] = dateParts;
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return calendarDate.getUTCFullYear() === Number(year)
    && calendarDate.getUTCMonth() === Number(month) - 1
    && calendarDate.getUTCDate() === Number(day)
    && Number(hour) <= 23
    && Number(minute) <= 59
    && Number(second) <= 59
    && Number.isFinite(Date.parse(value));
};

const normalizeKennitala = value => {
  if (typeof value !== 'string' || !/^\d{6}-?\d{4}$/.test(value.trim())) return null;
  return value.trim().replace(/^(\d{6})-?(\d{4})$/, '$1-$2');
};

const validateBookingRequest = (body, identity = null) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'A booking request body is required.' };
  }

  const brandId = positiveId(body.brand_id);
  const serviceId = positiveId(body.service_id);
  const staffId = positiveId(body.staff_id);
  if (!brandId || !serviceId || !staffId) {
    return { error: 'Valid brand_id, service_id, and staff_id are required.' };
  }

  const customerId = identity?.type === 'customer' ? positiveId(identity.id) : null;
  if (identity && !customerId) return { error: 'Only an authenticated customer may use a customer identity.' };

  const kennitala = customerId ? null : normalizeKennitala(body.kennitala);
  if (!customerId && (typeof body.full_name !== 'string' || !body.full_name.trim()
      || body.full_name.trim().length > 255
      || typeof body.phone_number !== 'string' || !body.phone_number.trim()
      || body.phone_number.trim().length > 50)) {
    return { error: 'Guest bookings require customer full_name and phone_number.' };
  }
  const email = customerId ? null : typeof body.email === 'string' ? body.email.trim() : '';
  if (!customerId && (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: 'Guest bookings require a valid customer email address.' };
  }
  if (!customerId && !kennitala) {
    return { error: 'Guest kennitala must contain 10 digits, optionally separated by a hyphen.' };
  }

  if (body.consent_privacy !== true) {
    return { error: 'Privacy consent must be provided to create a booking.' };
  }

  if (!validTimestamp(body.start_time)) {
    return { error: 'start_time must be a valid ISO 8601 timestamp with an explicit timezone offset.' };
  }

  if (body.custom_options !== undefined && body.custom_options !== null
      && (typeof body.custom_options !== 'object' || Array.isArray(body.custom_options))) {
    return { error: 'custom_options must be an object.' };
  }

  if (body.health_info !== undefined && body.health_info !== null && typeof body.health_info !== 'string') {
    return { error: 'health_info must be a string.' };
  }

  return {
    value: {
      brandId,
      serviceId,
      staffId,
      customerId,
      fullName: customerId ? null : body.full_name.trim(),
      email,
      phoneNumber: customerId ? null : body.phone_number.trim(),
      kennitala,
      startTime: new Date(body.start_time),
      customOptions: body.custom_options ?? null,
      healthInfo: body.health_info ?? null,
      consentPrivacy: true,
    },
  };
};

module.exports = { BOOKING_TIME_ZONE, isValidTimestamp: validTimestamp, normalizeKennitala, validateBookingRequest };