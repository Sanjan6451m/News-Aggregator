# News Aggregator

A powerful news aggregator that crawls major Indian news websites, analyzes content, and provides structured data through a REST API.

## Features

- Crawls major Indian news websites (Times of India, The Hindu, Hindustan Times)
- Categorizes articles by topic
- Generates article summaries (<150 words)
- Performs sentiment analysis
- Identifies key entities and affected states
- RESTful API for data access
- Scheduled crawling every 3 hours

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/news-aggregator
   NODE_ENV=development
   ```
4. Start MongoDB service
5. Run the application:
   ```bash
   npm run dev
   ```

## API Endpoints

### Get News Articles
```
GET /api/news
Query parameters:
- topic: Filter by topic
- source: Filter by news source
- state: Filter by affected state
- page: Page number (default: 1)
- limit: Articles per page (default: 10)
```

### Get Available Topics
```
GET /api/news/topics
```

### Get News Sources
```
GET /api/news/sources
```

### Get News Statistics
```
GET /api/news/stats
```

## Development

To run in development mode with hot reloading:
```bash
npm run dev
```

## Production

To run in production:
```bash
npm start
```