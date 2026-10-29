const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const apptRoutes = require('./routes/apptRoutes');
const staffRoutes = require('./routes/staffRoutes');
const staffAvailabilityRoutes = require('./routes/staffAvailabilityRoutes');
const staffServicesRoutes = require('./routes/staffServicesRoutes');
const brandRoutes = require('./routes/brandRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const customerNotificationRoutes = require('./routes/customerNotificationRoutes');
const staffNotificationRoutes = require('./routes/staffNotificationRoutes');

const createApp = ({ database, config }) => {
  const app = express();
  if (config.production) app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || (!config.production && config.corsOrigins.length === 0)) {
        return callback(null, true);
      }
      return callback(null, config.corsOrigins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', apptRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/staff-availability', staffAvailabilityRoutes);
  app.use('/api/staffservices', staffServicesRoutes);
  app.use('/api/brands', brandRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/customers/notifications', customerNotificationRoutes);
  app.use('/api/staff/notifications', staffNotificationRoutes);

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  const liveCheck = (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
  };
  app.get('/health', liveCheck);
  app.get('/health/live', liveCheck);
  app.get('/health/ready', async (req, res) => {
    try {
      await database.query('SELECT 1');
      res.json({ status: 'OK' });
    } catch (error) {
      console.error('Readiness check failed:', error.message);
      res.status(503).json({ status: 'NOT_READY' });
    }
  });

  return app;
};

module.exports = { createApp };
