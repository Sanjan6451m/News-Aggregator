const axios = require('axios');
const xml2js = require('xml2js');
const { StorageService } = require('./storage');
const { News } = require('../models/News');
const { v4: uuidv4 } = require('uuid');

// RSS feed URLs for different news sources
const NEWS_SOURCES = [
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    category: 'top'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/4719161.cms',
    category: 'india'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
    category: 'business'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/4719162.cms',
    category: 'sports'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/feeder/default.rss',
    category: 'news'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/business/feeder/default.rss',
    category: 'business'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/sport/feeder/default.rss',
    category: 'sports'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    category: 'india'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml',
    category: 'business'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
    category: 'sports'
  }
];

// Helper function to clean text by removing HTML tags and special characters
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/[^\w\s.,!?-]/g, '') // Keep only alphanumeric, basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to extract key entities from text
function extractEntities(text) {
  if (!text) return [];
  
  const cleanedText = cleanText(text);
  const words = cleanedText.split(/\s+/);
  
  // Filter out common words and short tokens
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const entities = words
    .filter(word => word.length > 2 && !commonWords.has(word.toLowerCase()))
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
  // Remove duplicates and sort
  return [...new Set(entities)].sort();
}

// Helper function to find affected states
function findAffectedStates(text) {
  if (!text) return [];
  
  const cleanedText = cleanText(text);
  const indianStates = new Set([
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ]);
  
  return [...indianStates].filter(state => 
    cleanedText.toLowerCase().includes(state.toLowerCase())
  );
}

// Helper function to determine topic based on keywords
function determineTopic(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  const topics = {
    politics: ['election', 'minister', 'government', 'party', 'congress', 'bjp', 'opposition', 'parliament', 'assembly'],
    business: ['economy', 'market', 'stock', 'trade', 'business', 'company', 'industry', 'finance'],
    sports: ['cricket', 'football', 'match', 'tournament', 'player', 'team', 'sport', 'game'],
    technology: ['tech', 'digital', 'internet', 'mobile', 'app', 'software', 'computer', 'ai', 'artificial intelligence'],
    agriculture: ['farmer', 'crop', 'agriculture', 'farm', 'rural', 'village', 'kisan'],
    entertainment: ['movie', 'film', 'actor', 'actress', 'bollywood', 'hollywood', 'celebrity', 'star'],
    environment: ['climate', 'environment', 'pollution', 'forest', 'wildlife', 'green', 'eco'],
    healthcare: ['health', 'medical', 'hospital', 'doctor', 'disease', 'treatment', 'medicine']
  };
  
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return topic;
    }
  }
  
  return 'general';
}

// Helper function to summarize text
function summarizeText(text) {
  if (!text) return '';
  
  const cleanedText = cleanText(text);
  const sentences = cleanedText.split(/[.!?]+/);
  
  // Take first 2-3 sentences as summary
  return sentences.slice(0, 3).join('. ') + '.';
}

// Helper function to analyze sentiment
function analyzeSentiment(text) {
  if (!text) return 0;
  
  const cleanedText = cleanText(text);
  const positiveWords = new Set(['good', 'great', 'excellent', 'positive', 'success', 'win', 'happy', 'better']);
  const negativeWords = new Set(['bad', 'poor', 'negative', 'failure', 'lose', 'unhappy', 'worse', 'problem']);
  
  const words = cleanedText.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.has(word)) score += 0.1;
    if (negativeWords.has(word)) score -= 0.1;
  });
  
  return Math.max(-1, Math.min(1, score));
}

// Function to parse RSS feed
async function parseRSSFeed(source) {
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    // Handle different RSS feed formats
    const items = result.rss?.channel?.[0]?.item || 
                 result.feed?.entry || 
                 [];
    
    return items.map(item => {
      const title = item.title?.[0] || item.title?.[0]?._ || '';
      const link = item.link?.[0] || item.link?.[0]?.$.href || '';
      const description = item.description?.[0] || item.summary?.[0] || '';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
      const imageUrl = item['media:content']?.[0]?.$.url || 
                      item['media:thumbnail']?.[0]?.$.url || 
                      '';
      
      return {
        title: cleanText(title),
        url: link,
        content: cleanText(description),
        publishedAt: new Date(pubDate).toISOString(),
        imageUrl
      };
    });
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error.message);
    return [];
  }
}

// Main scraping function
async function scrapeNews() {
  const storage = new StorageService();
  await storage.initialize(); // Initialize storage service
  
  for (const source of NEWS_SOURCES) {
    console.log(`\nScraping from ${source.name}`);
    console.log(`Fetching RSS feed: ${source.url}`);
    
    const articles = await parseRSSFeed(source);
    console.log(`Found ${articles.length} articles in RSS feed\n`);
    
    for (const article of articles) {
      console.log(`Processing article: "${article.title}" (${article.url})`);
      
      // Skip if no content
      if (!article.content) {
        console.log('Skipping article - no content found');
        continue;
      }
      
      // Check if article already exists
      const existingArticle = await storage.findByUrl(article.url);
      if (existingArticle) {
        console.log(`Found article by URL: ${article.url}`);
        console.log('Article already exists in storage');
        continue;
      }
      
      // Process article
      const processedArticle = new News({
        id: uuidv4(),
        title: article.title,
        url: article.url,
        source: source.name,
        topic: determineTopic(article.title, article.content),
        summary: summarizeText(article.content),
        sentimentScore: analyzeSentiment(article.content),
        keyEntities: extractEntities(article.content),
        affectedStates: findAffectedStates(article.content),
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,
        createdAt: new Date().toISOString()
      });
      
      await storage.save(processedArticle);
      console.log('Article saved successfully');
    }
  }
  
  console.log('\nScraping completed successfully');
}

module.exports = {
  scrapeNews
}; 