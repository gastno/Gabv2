// src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizeKennitala } = require('../services/bookingContract');
const { registerCustomerProfile } = require('../services/customerIdentityService');

const SALT_ROUNDS = 10;

// Helper to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// 1. Staff & Admin Login
exports.staffLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const queryText = `
      SELECT s.*, r.name AS role_name 
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE s.username = $1 AND s.is_active = TRUE;
    `;
    const result = await db.query(queryText, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const staffMember = result.rows[0];

    // Compare bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, staffMember.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Token Payload
    const tokenPayload = {
      id: staffMember.id,
      username: staffMember.username,
      role: staffMember.role_name, // 'admin', 'staff', or 'super_admin'
      type: 'staff',
    };

    const token = generateToken(tokenPayload);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: staffMember.id,
        username: staffMember.username,
        full_name: staffMember.full_name,
        role: staffMember.role_name,
      },
    });
  } catch (error) {
    console.error('Staff Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Customer Registration
exports.registerCustomer = async (req, res) => {
  const { full_name, phone_number, email, password } = req.body || {};
  const kennitala = normalizeKennitala(req.body?.kennitala);

  if (typeof full_name !== 'string' || !full_name.trim()
      || full_name.trim().length > 255
      || typeof phone_number !== 'string' || !phone_number.trim()
      || phone_number.trim().length > 50
      || !kennitala
      || typeof email !== 'string' || !email.trim()
      || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Full name, phone number, Kennitala, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const customer = await registerCustomerProfile(db, {
      fullName: full_name.trim(),
      phoneNumber: phone_number.trim(),
      kennitala,
      email: email.trim(),
      passwordHash: hashedPassword,
    });

    const tokenPayload = {
      id: customer.id,
      email: customer.email,
      role: 'customer',
      type: 'customer',
    };

    const token = generateToken(tokenPayload);

    res.status(201).json({
      message: 'Customer account created successfully',
      token,
      customer,
    });
  } catch (error) {
    if (error.status === 409 || error.code === '23505') {
      return res.status(409).json({ error: 'Registration could not be completed with these details.' });
    }
    res.status(500).json({ error: 'Failed to register customer' });
  }
};

// 3. Customer Login
exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM customers WHERE email = $1 AND is_registered = TRUE', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, customer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: customer.id,
      email: customer.email,
      role: 'customer',
      type: 'customer',
    };

    const token = generateToken(tokenPayload);

    res.json({
      message: 'Login successful',
      token,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Customer Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};