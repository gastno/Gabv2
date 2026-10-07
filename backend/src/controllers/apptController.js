// src/controllers/apptController.js
const db = require('../config/db');
const { validateBookingRequest } = require('../services/bookingContract');
const { BookingError, createBooking } = require('../services/bookingService');
const { canTransitionAppointment, isAppointmentAccessible } = require('../services/appointmentAccess');

const appointmentReadQuery = `
  SELECT a.id, a.brand_id, a.service_id, a.staff_id, a.customer_id,
         a.start_time, a.end_time, a.duration_snapshot_minutes, a.price_snapshot_isk,
         a.custom_options, a.status, a.fee_status, a.payment_status, a.cancellation_reason, a.created_at,
         service.name AS service_name, staff.full_name AS staff_name,
         customer.full_name AS customer_name, customer.phone_number AS customer_phone,
         customer.email AS customer_email, customer.kennitala AS customer_kennitala,
         customer.health_info AS health_info
  FROM appointments a
  JOIN services service ON service.id = a.service_id
  JOIN staff staff ON staff.id = a.staff_id
  JOIN customers customer ON customer.id = a.customer_id
`;

const parsePositiveId = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const authorizeAppointment = async (queryable, actor, appointment) => {
  if (actor?.type === 'customer' || actor?.role === 'staff' || actor?.role === 'super_admin') {
    return isAppointmentAccessible(actor, appointment);
  }
  if (actor?.type === 'staff' && actor.role === 'admin') {
    const result = await queryable.query(
      'SELECT 1 FROM staff_brands WHERE staff_id = $1 AND brand_id = $2',
      [actor.id, appointment.brand_id]
    );
    return isAppointmentAccessible(actor, appointment, result.rows.length ? [appointment.brand_id] : []);
  }
  return false;
};

exports.createAppointment = async (req, res) => {
  // Create Appointment (Supports Guest & Registered, with Dynamic Pricing / Custom Options)
  if (req.user && req.user.type !== 'customer') {
    return res.status(403).json({ error: 'Only customer accounts may use authenticated customer booking.' });
  }
  const validation = validateBookingRequest(req.body, req.user || null);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const appointment = await createBooking(db, validation.value);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    // 1. Log the full error to your Node.js terminal
    console.error("\n=== DB BOOKING REJECTION ===");
    console.error(error);
    console.error("============================\n");

    if (error instanceof BookingError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.code === '23P01' || error.code === '23505') {
      return res.status(409).json({ error: 'The booking conflicts with an existing record.' });
    }
    
    // 2. Send the exact database error message back to the frontend
    res.status(500).json({ 
      error: `Failed to create appointment: ${error.message || error.detail || "Unknown constraint violation"}` 
    });
  }
};

exports.listAppointments = async (req, res) => {
  const actor = req.user;
  const brandId = req.query.brand_id === undefined ? null : parsePositiveId(req.query.brand_id);
  let where;
  let params;

  if (actor.type === 'customer') {
    where = 'a.customer_id = $1';
    params = [actor.id];
  } else if (actor.type === 'staff' && actor.role === 'staff') {
    where = 'a.staff_id = $1';
    params = [actor.id];
  } else if (actor.type === 'staff' && actor.role === 'admin') {
    if (!brandId) return res.status(400).json({ error: 'A valid brand_id is required for admin appointment reads.' });
    where = 'a.brand_id = $1 AND EXISTS (SELECT 1 FROM staff_brands scope WHERE scope.staff_id = $2 AND scope.brand_id = a.brand_id)';
    params = [brandId, actor.id];
  } else if (actor.type === 'staff' && actor.role === 'super_admin') {
    where = brandId ? 'a.brand_id = $1' : 'TRUE';
    params = brandId ? [brandId] : [];
  } else {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  try {
    const result = await db.query(`${appointmentReadQuery} WHERE ${where} ORDER BY a.start_time LIMIT 200`, params);
    return res.json({ appointments: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve appointments.' });
  }
};

exports.getAppointment = async (req, res) => {
  const appointmentId = parsePositiveId(req.params.id);
  if (!appointmentId) return res.status(400).json({ error: 'Invalid appointment ID.' });

  try {
    const result = await db.query(`${appointmentReadQuery} WHERE a.id = $1`, [appointmentId]);
    const appointment = result.rows[0];
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    if (!(await authorizeAppointment(db, req.user, appointment))) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve appointment.' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const appointmentId = parsePositiveId(req.params.id);
  const nextStatus = req.body?.status;
  if (!appointmentId) return res.status(400).json({ error: 'Invalid appointment ID.' });
  if (!['confirmed', 'completed', 'no_show'].includes(nextStatus)) {
    return res.status(400).json({ error: 'status must be confirmed, completed, or no_show.' });
  }
  if (req.user.type !== 'staff' || req.user.role === 'customer') {
    return res.status(403).json({ error: 'Only staff and admins may change appointment status.' });
  }

  try {
    const appointment = await db.withTransaction(async client => {
      const result = await client.query(
        'SELECT id, brand_id, staff_id, customer_id, status FROM appointments WHERE id = $1 FOR UPDATE',
        [appointmentId]
      );
      const current = result.rows[0];
      if (!current) throw new BookingError('Appointment not found.', 404);
      if (!(await authorizeAppointment(client, req.user, current))) {
        throw new BookingError('Forbidden.', 403);
      }
      if (!canTransitionAppointment(current.status, nextStatus)) {
        throw new BookingError(`Appointment cannot transition from ${current.status} to ${nextStatus}.`, 409);
      }
      const updated = await client.query(
        'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [nextStatus, appointmentId]
      );
      return updated.rows[0];
    });
    return res.json({ appointment });
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    if (error.code === '23P01' || error.code === '23505') {
      return res.status(409).json({ error: 'The appointment conflicts with an existing booking.' });
    }
    return res.status(500).json({ error: 'Failed to update appointment status.' });
  }
};

exports.updateAppointmentFeeStatus = async (req, res) => {
  const appointmentId = parsePositiveId(req.params.id);
  const feeStatus = req.body?.fee_status;
  const validFeeStatuses = ['none', 'awaiting_fee', 'fee_charged', 'fee_waived'];
  if (!appointmentId) return res.status(400).json({ error: 'Invalid appointment ID.' });
  if (!validFeeStatuses.includes(feeStatus)) {
    return res.status(400).json({ error: 'fee_status must be none, awaiting_fee, fee_charged, or fee_waived.' });
  }
  if (req.user?.type !== 'staff' || !['staff', 'admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only staff and admins may change appointment fee status.' });
  }

  try {
    const appointment = await db.withTransaction(async client => {
      const result = await client.query(
        'SELECT id, brand_id, staff_id, customer_id FROM appointments WHERE id = $1 FOR UPDATE',
        [appointmentId]
      );
      const current = result.rows[0];
      if (!current) throw new BookingError('Appointment not found.', 404);
      if (!(await authorizeAppointment(client, req.user, current))) {
        throw new BookingError('Forbidden.', 403);
      }
      const updated = await client.query(
        'UPDATE appointments SET fee_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [feeStatus, appointmentId]
      );
      return updated.rows[0];
    });
    return res.json({ appointment });
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'Failed to update appointment fee status.' });
  }
};

exports.updateAppointmentPaymentStatus = async (req, res) => {
  const appointmentId = parsePositiveId(req.params.id);
  const paymentStatus = req.body?.payment_status;
  const validPaymentStatuses = ['pending', 'accepted'];
  if (!appointmentId) return res.status(400).json({ error: 'Invalid appointment ID.' });
  if (!validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ error: 'payment_status must be pending or accepted.' });
  }
  if (req.user?.type !== 'staff' || !['staff', 'admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only staff and admins may change appointment payment status.' });
  }

  try {
    const appointment = await db.withTransaction(async client => {
      const result = await client.query(
        'SELECT id, brand_id, staff_id, customer_id FROM appointments WHERE id = $1 FOR UPDATE',
        [appointmentId]
      );
      const current = result.rows[0];
      if (!current) throw new BookingError('Appointment not found.', 404);
      if (!(await authorizeAppointment(client, req.user, current))) {
        throw new BookingError('Forbidden.', 403);
      }
      const updated = await client.query(
        'UPDATE appointments SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [paymentStatus, appointmentId]
      );
      return updated.rows[0];
    });
    return res.json({ appointment });
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'Failed to update appointment payment status.' });
  }
};

exports.cancelAppointment = async (req, res) => {
  const appointmentId = parsePositiveId(req.params.id);
  const reason = req.body?.reason;
  if (!appointmentId) return res.status(400).json({ error: 'Invalid appointment ID.' });
  if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) {
    return res.status(400).json({ error: 'reason must be a string of at most 500 characters.' });
  }

  try {
    const appointment = await db.withTransaction(async client => {
      const result = await client.query(
        'SELECT id, brand_id, staff_id, customer_id, status FROM appointments WHERE id = $1 FOR UPDATE',
        [appointmentId]
      );
      const current = result.rows[0];
      if (!current) throw new BookingError('Appointment not found.', 404);
      if (!(await authorizeAppointment(client, req.user, current))) {
        throw new BookingError('Forbidden.', 403);
      }
      if (!['pending', 'confirmed'].includes(current.status)) {
        throw new BookingError(`Appointment cannot be cancelled from ${current.status}.`, 409);
      }
      const updated = await client.query(`
        UPDATE appointments
        SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [reason?.trim() || null, appointmentId]);
      return updated.rows[0];
    });
    return res.json({ appointment });
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
};