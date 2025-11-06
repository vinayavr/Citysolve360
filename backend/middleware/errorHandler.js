const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Import error handlers (AFTER routes are defined)
let errorHandler, notFoundHandler;
try {
  const errorHandlers = require('./middleware/errorHandler');
  errorHandler = errorHandlers.errorHandler;
  notFoundHandler = errorHandlers.notFoundHandler;
} catch (err) {
  console.log('No custom error handlers found, using default');
}

// 404 Handler
if (notFoundHandler) {
  app.use(notFoundHandler);
} else {
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });
}

// Global Error Handler (must be last)
if (errorHandler) {
  app.use(errorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
