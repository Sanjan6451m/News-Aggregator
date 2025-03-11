const fs = require('fs').promises;
const path = require('path');
const { scrapeNews } = require('./scraper');

// In-memory storage for serverless environment
let globalArticles = [];

class StorageService {
  constructor() {
    if (StorageService.instance) {
      return StorageService.instance;
    }
    StorageService.instance = this;
    
    this.articles = globalArticles;
    this.defaultImageUrl = 'https://via.placeholder.com/400x300?text=No+Image+Available';
    this.initialized = false;
    this.lastScrapedAt = null;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Scrape news if no articles exist or if last scrape was more than 15 minutes ago
      if (this.articles.length === 0 || this.shouldScrape()) {
        await this.refreshArticles();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      this.articles = [];
      this.initialized = true;
    }
  }

  shouldScrape() {
    if (!this.lastScrapedAt) return true;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.lastScrapedAt < fifteenMinutesAgo;
  }

  async refreshArticles() {
    try {
      console.log('Scraping fresh news articles...');
      const scrapedArticles = await scrapeNews();
      
      if (scrapedArticles && scrapedArticles.length > 0) {
        // Keep only the latest 100 articles
        this.articles = scrapedArticles
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 100);
        globalArticles = this.articles;
        this.lastScrapedAt = new Date();
        console.log(`Successfully scraped ${scrapedArticles.length} articles`);
      } else if (this.articles.length === 0) {
        // If scraping failed and we have no articles, add sample articles
        await this.addSampleArticles();
      }
    } catch (error) {
      console.error('Error refreshing articles:', error);
      if (this.articles.length === 0) {
        await this.addSampleArticles();
      }
    }
  }

  async addSampleArticles() {
    const sampleArticles = [
      {
        id: '1',
        title: "India's Economic Growth",
        url: "https://example.com/india-economy",
        source: "Times of India",
        topic: "business",
        summary: "India's economy shows strong growth in the latest quarter.",
        sentimentScore: 0.8,
        keyEntities: ["India", "Economy"],
        affectedStates: ["Maharashtra", "Gujarat"],
        imageUrl: "https://via.placeholder.com/400x300?text=Economy",
        publishedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: "Technology Innovation in India",
        url: "https://example.com/tech",
        source: "Hindustan Times",
        topic: "technology",
        summary: "Indian tech startups are making waves globally.",
        sentimentScore: 0.7,
        keyEntities: ["Technology", "Startups"],
        affectedStates: ["Karnataka", "Telangana"],
        imageUrl: "https://via.placeholder.com/400x300?text=Technology",
        publishedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: "Sports Update",
        url: "https://example.com/sports",
        source: "The Hindu",
        topic: "sports",
        summary: "Latest updates from the world of sports.",
        sentimentScore: 0.6,
        keyEntities: ["Sports", "Cricket"],
        affectedStates: ["Delhi", "Mumbai"],
        imageUrl: "https://via.placeholder.com/400x300?text=Sports",
        publishedAt: new Date().toISOString()
      }
    ];

    for (const article of sampleArticles) {
      await this.save(article);
    }
  }

  async save(article) {
    if (!article || !article.url) {
      throw new Error('Invalid article data: missing required fields');
    }

    if (!article.imageUrl) {
      article.imageUrl = this.defaultImageUrl;
    }

    if (!article.publishedAt) {
      article.publishedAt = new Date().toISOString();
    }

    if (!article.id) {
      article.id = Date.now().toString();
    }

    const existingIndex = this.articles.findIndex(a => a.url === article.url);
    if (existingIndex >= 0) {
      this.articles[existingIndex] = { ...this.articles[existingIndex], ...article };
    } else {
      this.articles.push(article);
    }
    
    // Update global articles
    globalArticles = this.articles;
    return article;
  }

  async getArticles({ topic, source, state, page = 1, limit = 20 }) {
    try {
      // Check if we need to refresh articles
      if (this.shouldScrape()) {
        await this.refreshArticles();
      }

      let filteredArticles = [...this.articles];

      if (topic) {
        filteredArticles = filteredArticles.filter(article => 
          article.topic && article.topic.toLowerCase() === topic.toLowerCase()
        );
      }
      if (source) {
        filteredArticles = filteredArticles.filter(article => 
          article.source && article.source.toLowerCase() === source.toLowerCase()
        );
      }
      if (state) {
        filteredArticles = filteredArticles.filter(article => 
          Array.isArray(article.affectedStates) && 
          article.affectedStates.some(s => s.toLowerCase() === state.toLowerCase())
        );
      }

      // Sort by published date
      filteredArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

      return {
        articles: paginatedArticles,
        total: filteredArticles.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredArticles.length / limit)
      };
    } catch (error) {
      console.error('Error in getArticles:', error);
      return {
        articles: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0
      };
    }
  }

  async getDistinct(field) {
    try {
      if (!field) return [];
      const values = new Set();
      this.articles.forEach(article => {
        if (Array.isArray(article[field])) {
          article[field].forEach(value => {
            if (value) values.add(value);
          });
        } else if (article[field]) {
          values.add(article[field]);
        }
      });
      return Array.from(values).sort();
    } catch (error) {
      console.error(`Error in getDistinct for field ${field}:`, error);
      return [];
    }
  }

  async getStats() {
    try {
      const totalArticles = this.articles.length;
      const topics = await this.getDistinct('topic');
      const sources = await this.getDistinct('source');
      const states = await this.getDistinct('affectedStates');

      return {
        totalArticles,
        topics: topics.length,
        sources: sources.length,
        states: states.length,
        latestArticle: this.articles.length > 0 ? 
          this.articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0].publishedAt 
          : null
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        totalArticles: 0,
        topics: 0,
        sources: 0,
        states: 0,
        latestArticle: null
      };
    }
  }
}

module.exports = { StorageService }; 