const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Load environment variables
dotenv.config({ path: `${process.cwd()}/.env` });

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN,
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/', authRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();