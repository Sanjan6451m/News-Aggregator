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
    topic: 'general'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/4719161.cms',
    topic: 'india'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
    topic: 'world'
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/1898272.cms',
    topic: 'business'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    topic: 'india'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/international/feeder/default.rss',
    topic: 'world'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/business/feeder/default.rss',
    topic: 'business'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    topic: 'india'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
    topic: 'world'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml',
    topic: 'business'
  }
];

// Helper function to extract image URL from content
function extractImageUrl(content) {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

// Helper function to clean text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to extract state names from text
function extractStates(text) {
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Mumbai'
  ];

  const states = new Set();
  const textLower = text.toLowerCase();
  
  indianStates.forEach(state => {
    if (textLower.includes(state.toLowerCase())) {
      states.add(state);
    }
  });

  return Array.from(states);
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
    const response = await axios.get(source.url);
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    const items = result.rss.channel.item;
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
      title: cleanText(item.title),
      url: item.link,
      source: source.name,
      topic: source.topic,
      summary: cleanText(item.description),
      imageUrl: extractImageUrl(item.description) || 'https://via.placeholder.com/400x300?text=News',
      publishedAt: new Date(item.pubDate).toISOString(),
      keyEntities: [],
      affectedStates: extractStates(item.description + ' ' + item.title),
      sentimentScore: 0.5 // Default neutral sentiment
    }));
  } catch (error) {
    console.error(`Error parsing RSS feed for ${source.name}:`, error);
    return [];
  }
}

// Main scraping function
async function scrapeNews() {
  const storage = new StorageService();
  await storage.initialize();

  console.log('Starting news scraping...');
  let totalArticles = 0;

  for (const source of NEWS_SOURCES) {
    try {
      console.log(`Scraping from ${source.name} (${source.topic})...`);
      const articles = await parseRSSFeed(source);
      console.log(`Found ${articles.length} articles from ${source.name}`);

      for (const article of articles) {
        const existing = await storage.findByUrl(article.url);
        if (!existing) {
          await storage.save(article);
          totalArticles++;
        }
      }
    } catch (error) {
      console.error(`Error processing ${source.name}:`, error);
    }
  }

  console.log(`Scraping completed. Added ${totalArticles} new articles.`);
  return totalArticles;
}

module.exports = { scrapeNews }; 