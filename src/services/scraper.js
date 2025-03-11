const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const NEWS_SOURCES = [
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    topic: 'general'
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/feeder/default.rss',
    topic: 'general'
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    topic: 'general'
  },
  {
    name: 'Economic Times',
    url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    topic: 'business'
  },
  {
    name: 'Business Standard',
    url: 'https://www.business-standard.com/rss/latest.rss',
    topic: 'business'
  },
  {
    name: 'NDTV Sports',
    url: 'https://sports.ndtv.com/rss/all',
    topic: 'sports'
  },
  {
    name: 'ESPN Cricinfo',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    topic: 'sports'
  }
];

async function parseXMLToJSON(xml) {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');
    const articles = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const article = {
        id: uuidv4(),
        title: getElementText(item, 'title'),
        url: getElementText(item, 'link'),
        summary: getElementText(item, 'description'),
        publishedAt: new Date(getElementText(item, 'pubDate')).toISOString(),
        imageUrl: extractImageUrl(item),
        source: '',
        topic: '',
        sentimentScore: Math.random() * 0.5 + 0.5, // Random score between 0.5 and 1
        keyEntities: extractKeywords(getElementText(item, 'title') + ' ' + getElementText(item, 'description')),
        affectedStates: extractStates(getElementText(item, 'title') + ' ' + getElementText(item, 'description'))
      };
      articles.push(article);
    }

    resolve(articles);
  });
}

function getElementText(item, tagName) {
  const element = item.getElementsByTagName(tagName)[0];
  return element ? element.textContent : '';
}

function extractImageUrl(item) {
  // Try to find image in media:content
  const mediaContent = item.getElementsByTagName('media:content')[0];
  if (mediaContent && mediaContent.getAttribute('url')) {
    return mediaContent.getAttribute('url');
  }

  // Try to find image in enclosure
  const enclosure = item.getElementsByTagName('enclosure')[0];
  if (enclosure && enclosure.getAttribute('url')) {
    return enclosure.getAttribute('url');
  }

  // Try to find image in description
  const description = getElementText(item, 'description');
  const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return 'https://via.placeholder.com/400x300?text=No+Image';
}

function extractKeywords(text) {
  const commonKeywords = [
    'India', 'Economy', 'Politics', 'Technology', 'Sports', 'Cricket',
    'Business', 'Market', 'Government', 'Policy', 'Development',
    'Education', 'Health', 'Environment', 'Infrastructure'
  ];

  return commonKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 5);
}

function extractStates(text) {
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Mumbai'
  ];

  return indianStates.filter(state => 
    text.toLowerCase().includes(state.toLowerCase())
  );
}

async function scrapeNews() {
  const articles = [];

  for (const source of NEWS_SOURCES) {
    try {
      const response = await axios.get(source.url);
      const parsedArticles = await parseXMLToJSON(response.data);
      
      // Add source and topic to each article
      parsedArticles.forEach(article => {
        article.source = source.name;
        article.topic = source.topic;
      });

      articles.push(...parsedArticles);
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error.message);
    }
  }

  return articles;
}

module.exports = {
  scrapeNews
}; 