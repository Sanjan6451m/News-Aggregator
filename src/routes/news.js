const express = require('express');
const router = express.Router();
const { StorageService } = require('../services/storage');

// Initialize storage service
const storage = new StorageService();

// Initialize storage on startup
(async () => {
  try {
    await storage.initialize();
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
})();

// Get all news articles with filtering options
router.get('/', async (req, res) => {
  try {
    const { topic, source, state, page = 1, limit = 20 } = req.query;
    
    // Validate query parameters
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    
    const result = await storage.getArticles({ 
      topic: topic?.trim(), 
      source: source?.trim(), 
      state: state?.trim(), 
      page: validatedPage, 
      limit: validatedLimit 
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch articles',
      message: error.message 
    });
  }
});

// Get available topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await storage.getDistinct('topic');
    res.json(topics || []);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch topics',
      message: error.message 
    });
  }
});

// Get available sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await storage.getDistinct('source');
    res.json(sources || []);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sources',
      message: error.message 
    });
  }
});

// Get news statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getStats();
    res.json(stats || {
      totalArticles: 0,
      topics: 0,
      sources: 0,
      states: 0,
      latestArticle: null
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Add sample articles for testing
router.post('/add-sample', async (req, res) => {
  try {
    await storage.addSampleArticles();
    res.json({
      message: 'Sample articles added successfully',
      count: (await storage.getStats()).totalArticles
    });
  } catch (error) {
    console.error('Error adding sample articles:', error);
    res.status(500).json({ 
      error: 'Failed to add sample articles',
      message: error.message 
    });
  }
});

module.exports = router; 