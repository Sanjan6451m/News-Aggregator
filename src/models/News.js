const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  sentimentScore: {
    type: Number,
    required: true
  },
  keyEntities: [{
    type: String
  }],
  affectedStates: [{
    type: String
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('News', newsSchema);

class News {
  constructor({
    id,
    title,
    url,
    source,
    topic,
    summary,
    sentimentScore,
    keyEntities,
    affectedStates,
    imageUrl,
    publishedAt,
    createdAt
  }) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.source = source;
    this.topic = topic;
    this.summary = summary;
    this.sentimentScore = sentimentScore;
    this.keyEntities = keyEntities || [];
    this.affectedStates = affectedStates || [];
    this.imageUrl = imageUrl || '';
    this.publishedAt = publishedAt;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      source: this.source,
      topic: this.topic,
      summary: this.summary,
      sentimentScore: this.sentimentScore,
      keyEntities: this.keyEntities,
      affectedStates: this.affectedStates,
      imageUrl: this.imageUrl,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt
    };
  }
}

module.exports = {
  News
}; 