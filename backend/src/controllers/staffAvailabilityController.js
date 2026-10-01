const db = require('../config/db');
const { BOOKING_TIME_ZONE } = require('../services/bookingContract');
const { BookingError } = require('../services/bookingService');
const {
  addStaffUnavailability,
  getStaffAvailability,
  isStaffInAdminScope,
  isValidLocalDate,
  normalizeAvailabilityShifts,
  removeStaffUnavailability,
  replaceStaffAvailability,
  validateUnavailablePeriod,
} = require('../services/staffAvailabilityService');

const positiveId = value => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const respondError = (res, error, fallback) => {
  if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
  if (error.code === '23P01' || error.code === '23505') {
    return res.status(409).json({ error: 'Availability conflicts with existing records.' });
  }
  return res.status(500).json({ error: fallback });
};

exports.getSelfAvailability = async (req, res) => {
  if (req.user.type !== 'staff') return res.status(403).json({ error: 'Staff authentication is required.' });
  const date = req.params.date;
  if (!isValidLocalDate(date)) return res.status(400).json({ error: 'date must be a valid YYYY-MM-DD Iceland-local date.' });
  try {
    const availability = await getStaffAvailability(db, req.user.id, date);
    return res.json({ time_zone: BOOKING_TIME_ZONE, ...availability });
  } catch (error) {
    return respondError(res, error, 'Failed to retrieve staff availability.');
  }
};

exports.replaceSelfAvailability = async (req, res) => {
  if (req.user.type !== 'staff') return res.status(403).json({ error: 'Staff authentication is required.' });
  const date = req.params.date;
  if (!isValidLocalDate(date)) return res.status(400).json({ error: 'date must be a valid YYYY-MM-DD Iceland-local date.' });
  const validation = normalizeAvailabilityShifts(req.body?.shifts);
  if (validation.error) return res.status(400).json({ error: validation.error });
  try {
    const availability = await replaceStaffAvailability(db, req.user.id, date, validation.value);
    return res.json({ time_zone: BOOKING_TIME_ZONE, ...availability });
  } catch (error) {
    return respondError(res, error, 'Failed to update staff availability.');
  }
};

exports.addSelfUnavailability = async (req, res) => {
  if (req.user.type !== 'staff') return res.status(403).json({ error: 'Staff authentication is required.' });
  const validation = validateUnavailablePeriod(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  try {
    const unavailability = await addStaffUnavailability(db, req.user.id, validation.value);
    return res.status(201).json({ unavailability });
  } catch (error) {
    return respondError(res, error, 'Failed to add unavailable period.');
  }
};

exports.removeSelfUnavailability = async (req, res) => {
  if (req.user.type !== 'staff') return res.status(403).json({ error: 'Staff authentication is required.' });
  const unavailabilityId = positiveId(req.params.id);
  if (!unavailabilityId) return res.status(400).json({ error: 'Invalid unavailability ID.' });
  try {
    const removed = await removeStaffUnavailability(db, req.user.id, unavailabilityId);
    if (!removed) return res.status(404).json({ error: 'Unavailable period not found.' });
    return res.json({ message: 'Unavailable period removed.' });
  } catch (error) {
    return respondError(res, error, 'Failed to remove unavailable period.');
  }
};

exports.getStaffAvailabilityForAdmin = async (req, res) => {
  const staffId = positiveId(req.params.staffId);
  const brandId = req.query.brand_id === undefined ? null : positiveId(req.query.brand_id);
  const date = req.query.date;
  if (!staffId) return res.status(400).json({ error: 'Invalid staff ID.' });
  if (req.user.role === 'admin' && !brandId) {
    return res.status(400).json({ error: 'A valid brand_id is required.' });
  }
  if (req.query.brand_id !== undefined && !brandId) return res.status(400).json({ error: 'Invalid brand_id.' });
  if (!isValidLocalDate(date)) return res.status(400).json({ error: 'A valid YYYY-MM-DD Iceland-local date is required.' });

  try {
    const isInScope = await isStaffInAdminScope(db, staffId, brandId, req.user);
    if (!isInScope) return res.status(404).json({ error: 'Staff member not found in the requested brand.' });

    const availability = await getStaffAvailability(db, staffId, date);
    return res.json({ staff_id: staffId, brand_id: brandId, time_zone: BOOKING_TIME_ZONE, ...availability });
  } catch (error) {
    return respondError(res, error, 'Failed to retrieve staff availability.');
  }
};