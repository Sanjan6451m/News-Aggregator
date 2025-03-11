const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { StorageService } = require('./services/storage');
const { scrapeNews } = require('./services/scraper');
const newsRoutes = require('./routes/news');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://news-aggregator-ui-sanjan-ms-projects.vercel.app/'
    : 'http://localhost:4200',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize storage service
const storage = new StorageService();

// Initialize storage and run initial scraping
(async () => {
  try {
    await storage.initialize();
    console.log('Storage initialized');
    
    // Run initial scraping
    console.log('Running initial news scraping...');
    const articlesAdded = await scrapeNews();
    console.log(`Initial scraping completed. Added ${articlesAdded} articles.`);
  } catch (error) {
    console.error('Initialization error:', error);
  }
})();

// Set up periodic scraping (every 15 minutes in production, every hour in development)
const SCRAPE_INTERVAL = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000;

setInterval(async () => {
  try {
    console.log('Running scheduled news scraping...');
    const articlesAdded = await scrapeNews();
    console.log(`Scheduled scraping completed. Added ${articlesAdded} articles.`);
  } catch (error) {
    console.error('Scheduled scraping error:', error);
  }
}, SCRAPE_INTERVAL);

// Routes
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    articlesCount: storage.articles.length
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