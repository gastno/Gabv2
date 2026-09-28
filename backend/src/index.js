const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const apptRoutes = require('./routes/apptRoutes');
const staffRoutes = require('./routes/staffRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', apptRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);

// Serve static assets from <root>/uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});