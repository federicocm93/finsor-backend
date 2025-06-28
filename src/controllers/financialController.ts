import { Request, Response } from 'express';
import OpenAIService from '../services/openaiService';
import MarketDataService from '../services/marketDataService';
import NewsService from '../services/newsService';
import { FinancialQuery, ApiResponse } from '../types';
import logger from '../utils/logger';

class FinancialController {
  private openaiService: OpenAIService;
  private marketDataService: MarketDataService;
  private newsService: NewsService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.marketDataService = new MarketDataService();
    this.newsService = new NewsService();
  }

  async analyzeQuery(req: Request, res: Response): Promise<void> {
    try {
      const { question, userId }: FinancialQuery = req.body;

      if (!question || question.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Question is required',
          timestamp: new Date()
        } as ApiResponse<never>);
        return;
      }

      logger.info(`Processing financial query: ${question.substring(0, 100)}...`);

      const analysis = await this.openaiService.analyzeFinancialQuery({ question, userId });

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date()
      } as ApiResponse<typeof analysis>);

    } catch (error) {
      logger.error('Error in analyzeQuery:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
      } as ApiResponse<never>);
    }
  }

  async getMarketData(req: Request, res: Response): Promise<void> {
    try {
      const { symbol, type = 'stock' } = req.params;

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol is required',
          timestamp: new Date()
        } as ApiResponse<never>);
        return;
      }

      let marketData;
      if (type === 'crypto') {
        marketData = await this.marketDataService.getCryptoPrice(symbol);
      } else {
        marketData = await this.marketDataService.getStockPrice(symbol);
      }

      if (!marketData) {
        res.status(404).json({
          success: false,
          error: `No data found for symbol: ${symbol}`,
          timestamp: new Date()
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: marketData,
        timestamp: new Date()
      } as ApiResponse<typeof marketData>);

    } catch (error) {
      logger.error('Error in getMarketData:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
      } as ApiResponse<never>);
    }
  }

  async getNews(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, limit = '10' } = req.query;
      const limitNum = parseInt(limit as string, 10);

      let news;
      if (keyword) {
        news = await this.newsService.searchFinancialNews(keyword as string, limitNum);
      } else {
        news = await this.newsService.getLatestFinancialNews(limitNum);
      }

      res.json({
        success: true,
        data: news,
        timestamp: new Date()
      } as ApiResponse<typeof news>);

    } catch (error) {
      logger.error('Error in getNews:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
      } as ApiResponse<never>);
    }
  }
}

export default FinancialController;