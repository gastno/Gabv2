// src/controllers/apptController.js
const db = require('../config/db');

// Create Appointment (Supports Guest & Registered, with Dynamic Pricing / Custom Options)
exports.createAppointment = async (req, res) => {
  const {
    brand_id,
    service_id,
    staff_id,
    full_name,
    phone_number,
    kennitala,
    start_time,
    duration_minutes,
    price_isk,
    custom_options, // JSON object (e.g. tattoo size, complexity)
    health_info,
    consent_privacy
  } = req.body;

  try {
    // 1. Find or Create Guest Customer Profile
    let customerResult = await db.query('SELECT id FROM customers WHERE kennitala = $1', [kennitala]);
    let customerId;

    if (customerResult.rows.length === 0) {
      const newCustomer = await db.query(
        `INSERT INTO customers (full_name, phone_number, kennitala, health_info, consent_privacy)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [full_name, phone_number, kennitala, health_info, consent_privacy]
      );
      customerId = newCustomer.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
    }

    // 2. Calculate End Time
    const startTimeObj = new Date(start_time);
    const endTimeObj = new Date(startTimeObj.getTime() + duration_minutes * 60000);

    // 3. Insert Appointment with Price & Duration Snapshots
    const apptQuery = `
      INSERT INTO appointments 
      (brand_id, service_id, staff_id, customer_id, start_time, end_time, duration_snapshot_minutes, price_snapshot_isk, custom_options)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const apptValues = [
      brand_id,
      service_id,
      staff_id,
      customerId,
      startTimeObj,
      endTimeObj,
      duration_minutes,
      price_isk,
      custom_options ? JSON.stringify(custom_options) : null
    ];

    const newAppt = await db.query(apptQuery, apptValues);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: newAppt.rows[0]
    });

  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};