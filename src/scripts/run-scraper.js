const { scrapeNews } = require('../services/scraper');
const { StorageService } = require('../services/storage');

async function main() {
  console.log('Starting news scraping script...');
  
  try {
    // Initialize storage service
    const storage = new StorageService();
    await storage.initialize();
    
    // Run scraper
    await scrapeNews();
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
}

main(); 