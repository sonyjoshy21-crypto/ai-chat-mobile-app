const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// 1. Initializing Environment configs
dotenv.config();

// 2. Setting up Express Application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Registering Global Middleware
app.use(cors({
  origin: '*', // Allows cross-origin connection from React Native Expo simulators/browsers
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Connect to MongoDB database (with graceful local mock fallback logic)
connectDB();

// 5. Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// 6. Base Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 7. 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource path not found' });
});

// 8. Global Error boundary middleware
app.use((err, req, res, next) => {
  console.error('[Global Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
});

// 9. Start Server Listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 API SERVER IS NOW ACTIVE AND RUNNING ON: http://0.0.0.0:${PORT}`);
  console.log(`  💡 Health Check: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
