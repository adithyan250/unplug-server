const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
  credentials: allowedOrigin !== '*'
}));
app.use(express.json());

// Import middleware
const { protect } = require('./middleware/auth');

// Import controllers
const authController = require('./controllers/authController');
const screenTimeController = require('./controllers/screenTimeController');
const detoxController = require('./controllers/detoxController');

// Routes definitions

// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);
app.put('/api/auth/settings', protect, authController.updateSettings);
app.post('/api/auth/badges', protect, authController.awardBadge);

// 2. Screen Time routes
app.post('/api/screentime', protect, screenTimeController.logScreenTime);
app.get('/api/screentime', protect, screenTimeController.getLogs);
app.get('/api/screentime/stats', protect, screenTimeController.getStats);

// 3. Detox routes
app.post('/api/detox', protect, detoxController.logDetoxSession);
app.get('/api/detox', protect, detoxController.getDetoxHistory);
app.get('/api/detox/streak', protect, detoxController.getStreakInfo);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Digital Detox Tracker API is running' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB & Start Server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_detox';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
