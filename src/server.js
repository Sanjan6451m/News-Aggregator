const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { StorageService } = require('./services/storage');
const newsRoutes = require('./routes/news');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://news-aggregator-ui-sanjan-ms-projects.vercel.app'
    : 'http://localhost:4200',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize storage service
const storage = new StorageService();
storage.initialize().catch(console.error);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'News Aggregator API is running' });
});

// Routes
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableRoutes: [
      'GET /api/news',
      'GET /api/news/topics',
      'GET /api/news/sources',
      'GET /api/news/stats',
      'GET /api/health'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app; 