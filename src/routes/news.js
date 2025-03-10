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

// Add sample articles for testing
router.post('/add-sample', async (req, res) => {
  try {
    const sampleArticles = [
      {
        title: "India's Economic Growth",
        url: "https://example.com/india-economy",
        source: "Times of India",
        topic: "business",
        summary: "India's economy shows strong growth in the latest quarter, driven by manufacturing and services sectors.",
        sentimentScore: 0.8,
        keyEntities: ["India", "Economy", "Manufacturing"],
        affectedStates: ["Maharashtra", "Gujarat"],
        imageUrl: "https://example.com/images/economy.jpg"
      },
      {
        title: "Cricket World Cup 2024",
        url: "https://example.com/cricket",
        source: "The Hindu",
        topic: "sports",
        summary: "India prepares for the upcoming Cricket World Cup with high hopes and strong team selection.",
        sentimentScore: 0.6,
        keyEntities: ["Cricket", "World Cup", "India"],
        affectedStates: ["Delhi", "Mumbai"],
        imageUrl: "https://example.com/images/cricket.jpg"
      },
      {
        title: "Technology Innovation in India",
        url: "https://example.com/tech",
        source: "Hindustan Times",
        topic: "technology",
        summary: "Indian tech startups are making waves globally with innovative solutions in AI and blockchain.",
        sentimentScore: 0.7,
        keyEntities: ["Technology", "Startups", "AI"],
        affectedStates: ["Karnataka", "Telangana"],
        imageUrl: "https://example.com/images/tech.jpg"
      },
      {
        title: "New Agricultural Policy",
        url: "https://example.com/agriculture",
        source: "Times of India",
        topic: "agriculture",
        summary: "Government announces new agricultural policy focusing on sustainable farming and farmer welfare.",
        sentimentScore: 0.5,
        keyEntities: ["Agriculture", "Farmers", "Policy"],
        affectedStates: ["Punjab", "Haryana", "Uttar Pradesh"],
        imageUrl: "https://example.com/images/agriculture.jpg"
      },
      {
        title: "Bollywood's Latest Blockbuster",
        url: "https://example.com/entertainment",
        source: "The Hindu",
        topic: "entertainment",
        summary: "New Bollywood movie breaks box office records with stellar performances and innovative storytelling.",
        sentimentScore: 0.9,
        keyEntities: ["Bollywood", "Movie", "Box Office"],
        affectedStates: ["Maharashtra", "Delhi"],
        imageUrl: "https://example.com/images/entertainment.jpg"
      },
      {
        title: "Political Reforms",
        url: "https://example.com/politics",
        source: "Hindustan Times",
        topic: "politics",
        summary: "Major political reforms announced to improve transparency and accountability in governance.",
        sentimentScore: 0.4,
        keyEntities: ["Politics", "Reforms", "Government"],
        affectedStates: ["Delhi", "Uttar Pradesh"],
        imageUrl: "https://example.com/images/politics.jpg"
      },
      {
        title: "Environmental Initiatives",
        url: "https://example.com/environment",
        source: "Times of India",
        topic: "politics",
        summary: "New environmental policies introduced to combat climate change and promote sustainable development.",
        sentimentScore: 0.7,
        keyEntities: ["Environment", "Climate", "Policy"],
        affectedStates: ["Kerala", "Himachal Pradesh"],
        imageUrl: "https://example.com/images/environment.jpg"
      },
      {
        title: "Digital Transformation",
        url: "https://example.com/digital",
        source: "The Hindu",
        topic: "technology",
        summary: "India's digital transformation accelerates with new initiatives in e-governance and digital payments.",
        sentimentScore: 0.8,
        keyEntities: ["Digital", "Technology", "Innovation"],
        affectedStates: ["Andhra Pradesh", "Karnataka"],
        imageUrl: "https://example.com/images/digital.jpg"
      },
      {
        title: "Sports Infrastructure",
        url: "https://example.com/sports",
        source: "Hindustan Times",
        topic: "sports",
        summary: "Major investment in sports infrastructure to promote athletics and develop future champions.",
        sentimentScore: 0.6,
        keyEntities: ["Sports", "Infrastructure", "Investment"],
        affectedStates: ["Gujarat", "Maharashtra"],
        imageUrl: "https://example.com/images/sports.jpg"
      },
      {
        title: "Healthcare Reforms",
        url: "https://example.com/healthcare",
        source: "Times of India",
        topic: "politics",
        summary: "New healthcare reforms announced to improve medical services and make healthcare more accessible.",
        sentimentScore: 0.7,
        keyEntities: ["Healthcare", "Reforms", "Medical"],
        affectedStates: ["Delhi", "Tamil Nadu"],
        imageUrl: "https://example.com/images/healthcare.jpg"
      }
    ];

    const addedArticles = [];
    for (const article of sampleArticles) {
      const addedArticle = await storage.save(article);
      addedArticles.push(addedArticle);
    }

    res.json({
      message: `Added ${addedArticles.length} sample articles`,
      articles: addedArticles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all news articles with filtering options
router.get('/', async (req, res) => {
  try {
    const { topic, source, state, page = 1, limit = 20 } = req.query;
    const result = await storage.getArticles({ topic, source, state, page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get available topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await storage.getDistinct('topic');
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get available sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await storage.getDistinct('source');
    res.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get news statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 