import Parser from 'rss-parser';
import { NewsItem } from '../types';
import logger from '../utils/logger';

class NewsService {
  private parser: Parser;
  private feedUrls: string[];

  constructor() {
    this.parser = new Parser();
    this.feedUrls = [
      'https://feeds.reuters.com/reuters/businessNews',
      'https://feeds.bloomberg.com/markets/news.rss',
      'https://feeds.bbci.co.uk/news/business/rss.xml',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html'
    ];
  }

  async getLatestFinancialNews(limit: number = 10): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];

    for (const feedUrl of this.feedUrls) {
      try {
        const feed = await this.parser.parseURL(feedUrl);
        const feedName = this.extractFeedName(feedUrl);
        
        const newsItems: NewsItem[] = feed.items.slice(0, limit).map(item => ({
          title: item.title || '',
          description: item.contentSnippet || item.content || '',
          url: item.link || '',
          source: feedName,
          publishedAt: new Date(item.pubDate || Date.now())
        }));

        allNews.push(...newsItems);
      } catch (error) {
        logger.error(`Error fetching news from ${feedUrl}:`, error);
      }
    }

    // Sort by publication date and return the most recent
    return allNews
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  async searchFinancialNews(keyword: string, limit: number = 5): Promise<NewsItem[]> {
    const allNews = await this.getLatestFinancialNews(50);
    
    const filtered = allNews.filter(item => 
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.description.toLowerCase().includes(keyword.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  private extractFeedName(url: string): string {
    if (url.includes('reuters')) return 'Reuters';
    if (url.includes('bloomberg')) return 'Bloomberg';
    if (url.includes('bbc')) return 'BBC';
    if (url.includes('cnbc')) return 'CNBC';
    return 'Unknown Source';
  }
}

export default NewsService;