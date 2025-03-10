const fs = require('fs').promises;
const path = require('path');

class StorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.articlesFile = path.join(this.dataDir, 'articles.json');
    this.articles = [];
    this.defaultImageUrl = 'https://via.placeholder.com/400x300?text=No+Image+Available';
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadArticles();
    } catch (error) {
      console.error('Error initializing storage:', error);
      this.articles = [];
    }
  }

  async loadArticles() {
    try {
      const data = await fs.readFile(this.articlesFile, 'utf8');
      this.articles = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty array
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
      await fs.writeFile(this.articlesFile, JSON.stringify(this.articles, null, 2));
    } catch (error) {
      console.error('Error saving articles:', error);
    }
  }

  async findByUrl(url) {
    return this.articles.find(article => article.url === url);
  }

  async save(article) {
    // Add default image if none provided
    if (!article.imageUrl) {
      article.imageUrl = this.defaultImageUrl;
    }

    const existingIndex = this.articles.findIndex(a => a.url === article.url);
    if (existingIndex >= 0) {
      this.articles[existingIndex] = article;
    } else {
      this.articles.push(article);
    }
    await this.saveArticles();
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