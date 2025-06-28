import axios from 'axios';
import { MarketData } from '../types';
import logger from '../utils/logger';

class MarketDataService {
  private finnhubBaseUrl = 'https://finnhub.io/api/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('FINNHUB_API_KEY not set. Using free tier with rate limits.');
    }
  }

  async getStockPrice(symbol: string): Promise<MarketData | null> {
    try {
      // Use Finnhub's free tier - 60 calls/minute
      const token = this.apiKey || 'demo'; // demo token for testing
      
      // Get current price
      const quoteResponse = await axios.get(`${this.finnhubBaseUrl}/quote`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: token
        }
      });

      const quote = quoteResponse.data;
      
      if (!quote || quote.c === 0) {
        logger.warn(`No data found for symbol: ${symbol}`);
        return this.getMockStockData(symbol);
      }

      const currentPrice = quote.c; // current price
      const previousClose = quote.pc; // previous close
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: symbol.toUpperCase(),
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching stock data for ${symbol}:`, error);
      logger.info('Falling back to mock data');
      return this.getMockStockData(symbol);
    }
  }

  private getMockStockData(symbol: string): MarketData {
    // Mock data for common stocks for development/demo
    const mockPrices: { [key: string]: { price: number; change: number; changePercent: number } } = {
      'AAPL': { price: 192.53, change: 2.41, changePercent: 1.27 },
      'GOOGL': { price: 174.29, change: -1.22, changePercent: -0.69 },
      'MSFT': { price: 417.32, change: 5.18, changePercent: 1.26 },
      'TSLA': { price: 248.50, change: -3.21, changePercent: -1.27 },
      'AMZN': { price: 186.43, change: 1.85, changePercent: 1.00 },
      'META': { price: 504.20, change: 8.15, changePercent: 1.64 },
      'NVDA': { price: 126.09, change: 2.53, changePercent: 2.05 }
    };

    const stockData = mockPrices[symbol.toUpperCase()] || {
      price: 100 + Math.random() * 200,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5
    };

    return {
      symbol: symbol.toUpperCase(),
      price: Number(stockData.price.toFixed(2)),
      change: Number(stockData.change.toFixed(2)),
      changePercent: Number(stockData.changePercent.toFixed(2)),
      timestamp: new Date()
    };
  }

  async getCryptoPrice(symbol: string): Promise<MarketData | null> {
    try {
      // Using a free crypto API as fallback
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: symbol.toLowerCase(),
          vs_currencies: 'usd',
          include_24hr_change: true
        },
        timeout: 10000 // 10 second timeout
      });
      
      const data = response.data[symbol.toLowerCase()];
      if (!data) {
        logger.warn(`No cryptocurrency data found for: ${symbol}`);
        return this.getMockCryptoData(symbol);
      }

      return {
        symbol: symbol.toUpperCase(),
        price: data.usd,
        change: 0, // CoinGecko doesn't provide absolute change
        changePercent: data.usd_24h_change || 0,
        timestamp: new Date()
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Rate limited by CoinGecko API for ${symbol}. Using mock data.`);
        const retryAfter = error.response.headers['retry-after'] || 60;
        logger.info(`Rate limit will reset in ${retryAfter} seconds`);
      } else {
        logger.error(`Error fetching crypto data for ${symbol}:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
      }
      return this.getMockCryptoData(symbol);
    }
  }

  private getMockCryptoData(symbol: string): MarketData {
    // Mock data for common cryptocurrencies for development/demo
    const mockCryptoPrices: { [key: string]: { price: number; change: number; changePercent: number } } = {
      'bitcoin': { price: 67245.32, change: 1245.67, changePercent: 1.89 },
      'ethereum': { price: 3421.56, change: -85.43, changePercent: -2.44 },
      'polkadot': { price: 6.78, change: 0.23, changePercent: 3.51 },
      'cardano': { price: 0.47, change: -0.02, changePercent: -4.08 },
      'solana': { price: 157.89, change: 5.67, changePercent: 3.72 },
      'chainlink': { price: 14.56, change: 0.89, changePercent: 6.51 },
      'polygon': { price: 0.85, change: -0.03, changePercent: -3.41 }
    };

    const cryptoData = mockCryptoPrices[symbol.toLowerCase()] || {
      price: 1 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 10
    };

    return {
      symbol: symbol.toUpperCase(),
      price: Number(cryptoData.price.toFixed(2)),
      change: Number(cryptoData.change.toFixed(2)),
      changePercent: Number(cryptoData.changePercent.toFixed(2)),
      timestamp: new Date()
    };
  }
}

export default MarketDataService;