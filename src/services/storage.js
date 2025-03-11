const fs = require('fs').promises;
const path = require('path');

class StorageService {
  constructor() {
    if (StorageService.instance) {
      return StorageService.instance;
    }
    StorageService.instance = this;
    
    this.dataDir = path.join(__dirname, '../../data');
    this.articlesFile = path.join(this.dataDir, 'articles.json');
    this.articles = [];
    this.defaultImageUrl = 'https://via.placeholder.com/400x300?text=No+Image+Available';
    this.initialized = false;
    
    // Ensure the data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async initialize() {
    if (this.initialized) {
      console.log('Storage already initialized');
      return;
    }

    try {
      console.log('Initializing storage...');
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadArticles();
      this.initialized = true;
      console.log(`Storage initialized with ${this.articles.length} articles`);
    } catch (error) {
      console.error('Error initializing storage:', error);
      this.articles = [];
      this.initialized = true;
    }
  }

  async loadArticles() {
    try {
      console.log('Loading articles from:', this.articlesFile);
      const data = await fs.readFile(this.articlesFile, 'utf8');
      this.articles = JSON.parse(data) || [];
      console.log(`Loaded ${this.articles.length} articles from storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No articles file found, starting with empty array');
        this.articles = [];
        await this.saveArticles();
      } else {
        console.error('Error loading articles:', error);
        this.articles = [];
      }
    }
  }

  async saveArticles() {
    try {
      console.log(`Saving ${this.articles.length} articles to storage`);
      await fs.writeFile(this.articlesFile, JSON.stringify(this.articles, null, 2));
      console.log('Articles saved successfully');
    } catch (error) {
      console.error('Error saving articles:', error);
      throw new Error('Failed to save articles: ' + error.message);
    }
  }

  async findByUrl(url) {
    return this.articles.find(article => article.url === url);
  }

  async save(article) {
    if (!article || !article.url) {
      throw new Error('Invalid article data: missing required fields');
    }

    // Add default image if none provided
    if (!article.imageUrl) {
      article.imageUrl = this.defaultImageUrl;
    }

    // Add timestamp if not present
    if (!article.publishedAt) {
      article.publishedAt = new Date().toISOString();
    }

    const existingIndex = this.articles.findIndex(a => a.url === article.url);
    if (existingIndex >= 0) {
      this.articles[existingIndex] = { ...this.articles[existingIndex], ...article };
    } else {
      this.articles.push(article);
    }
    
    await this.saveArticles();
    return article;
  }

  async getAllArticles() {
    return this.articles;
  }

  async getArticlesByTopic(topic) {
    return this.articles.filter(article => article.topic === topic);
  }

  async getArticlesBySource(source) {
    return this.articles.filter(article => article.source === source);
  }

  async getArticlesByState(state) {
    return this.articles.filter(article => article.affectedStates.includes(state));
  }

  async getLatestArticles(limit = 10) {
    return this.articles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  async getArticles({ topic, source, state, page = 1, limit = 10 }) {
    let filteredArticles = [...this.articles];

    // Apply filters
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
  }

  async getDistinct(field) {
    const distinctValues = new Set(this.articles.map(article => article[field]));
    return Array.from(distinctValues).sort();
  }

  async getStats() {
    const totalArticles = this.articles.length;
    const topics = await this.getDistinct('topic');
    const sources = await this.getDistinct('source');
    const states = await this.getDistinct('affectedStates');

    return {
      totalArticles,
      topics: topics.length,
      sources: sources.length,
      states: states.length,
      latestArticle: this.articles.length > 0 ? this.articles[0].publishedAt : null
    };
  }
}

module.exports = {
  StorageService
}; 