const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');
const { scrapeNews } = require('./services/scraper');
const newsRoutes = require('./routes/news');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Angular frontend
const corsOptions = {
  origin: 'http://localhost:4200', // Your Angular app URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/news', newsRoutes);

// Schedule news scraping every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log('Running scheduled news scraping...');
  try {
    await scrapeNews();
  } catch (error) {
    console.error('Error in scheduled scraping:', error);
  }
});

// Initial scraping when server starts
console.log('Starting initial news scraping...');
scrapeNews().catch(error => {
  console.error('Error in initial scraping:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 