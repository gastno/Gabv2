// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();
const { parsePoolSize } = require('./environment');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: parsePoolSize(process.env.DB_POOL_MAX),
});

const createDatabase = poolInstance => ({
  query: (text, params) => poolInstance.query(text, params),
  end: () => poolInstance.end(),
  withTransaction: async callback => {
    const client = await poolInstance.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Preserve the original failure for the caller.
      }
      throw error;
    } finally {
      client.release();
    }
  },
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database (appointment_db)');
});

module.exports = { ...createDatabase(pool), createDatabase };