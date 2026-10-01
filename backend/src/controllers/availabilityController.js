const db = require('../config/db');
const { BOOKING_TIME_ZONE, getAvailability, validateAvailabilityQuery } = require('../services/availabilityService');

exports.getAvailability = async (req, res) => {
  const validation = validateAvailabilityQuery(req.query);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const slots = await getAvailability(db, validation.value);
    return res.json({ time_zone: BOOKING_TIME_ZONE, slots: slots.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve appointment availability.' });
  }
};