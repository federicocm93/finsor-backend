import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

interface QueryRequest {
  query: string;
  type?: string[];
  limit?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  symbols?: string[];
}

interface VectorData {
  id: string;
  metadata: {
    source: string;
    type: string;
    timestamp: string;
    symbol?: string;
    [key: string]: any;
  };
  content: string;
  distance?: number;
}

interface Reference {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  url?: string;
  title?: string;
  symbol?: string;
}

interface QueryResponse {
  results: VectorData[];
  total: number;
  query: string;
  processingTime: number;
  cached?: boolean;
  references?: Reference[];
}

export class DataService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3002') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Data service request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Data service request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Data service response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Data service response error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async query(queryRequest: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await this.client.post('/query', queryRequest);
      return response.data;
    } catch (error) {
      logger.error('Failed to query data service:', error);
      throw new Error('Data service query failed');
    }
  }

  async getRecentData(type?: string, limit?: number): Promise<VectorData[]> {
    try {
      const params: any = {};
      if (type) params.type = type;
      if (limit) params.limit = limit;

      const response = await this.client.get('/recent', { params });
      return response.data.results;
    } catch (error) {
      logger.error('Failed to get recent data:', error);
      throw new Error('Failed to retrieve recent data');
    }
  }

  async searchBySymbol(symbol: string, type?: string, limit?: number): Promise<VectorData[]> {
    try {
      const params: any = {};
      if (type) params.type = type;
      if (limit) params.limit = limit;

      const response = await this.client.get(`/symbol/${symbol}`, { params });
      return response.data.results;
    } catch (error) {
      logger.error(`Failed to search by symbol ${symbol}:`, error);
      throw new Error('Symbol search failed');
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      logger.error('Failed to get data service stats:', error);
      throw new Error('Failed to retrieve stats');
    }
  }

  async triggerIngestion(type: string = 'all'): Promise<void> {
    try {
      await this.client.post('/ingest', { type });
      logger.info(`Triggered ${type} data ingestion`);
    } catch (error) {
      logger.error(`Failed to trigger ${type} ingestion:`, error);
      throw new Error('Failed to trigger data ingestion');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      logger.warn('Data service health check failed:', error);
      return false;
    }
  }

  // Enhanced query methods for financial analysis
  async getMarketContext(symbols: string[]): Promise<VectorData[]> {
    try {
      const response = await this.query({
        query: `market data analysis for ${symbols.join(', ')}`,
        type: ['crypto', 'stock'],
        symbols: symbols.map(s => s.toUpperCase()),
        limit: 20,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        },
      });
      return response.results;
    } catch (error) {
      logger.error('Failed to get market context:', error);
      return [];
    }
  }

  async getNewsContext(query: string): Promise<VectorData[]> {
    try {
      const response = await this.query({
        query,
        type: ['news'],
        limit: 15,
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          end: new Date(),
        },
      });
      return response.results;
    } catch (error) {
      logger.error('Failed to get news context:', error);
      return [];
    }
  }

  async getEconomicContext(): Promise<VectorData[]> {
    try {
      const response = await this.query({
        query: 'economic indicators inflation unemployment GDP interest rates',
        type: ['economic', 'rates'],
        limit: 10,
      });
      return response.results;
    } catch (error) {
      logger.error('Failed to get economic context:', error);
      return [];
    }
  }

  async getTrendsContext(keywords: string[]): Promise<VectorData[]> {
    try {
      const response = await this.query({
        query: keywords.join(' '),
        type: ['trends'],
        limit: 10,
      });
      return response.results;
    } catch (error) {
      logger.error('Failed to get trends context:', error);
      return [];
    }
  }

  // Format data for LLM context
  formatForLLM(data: VectorData[]): string {
    if (data.length === 0) {
      return 'No recent data available.';
    }

    return data.map(item => {
      const timestamp = new Date(item.metadata.timestamp).toLocaleString();
      const source = item.metadata.source;
      const type = item.metadata.type;
      
      return `[${type.toUpperCase()}] ${source} (${timestamp}): ${item.content}`;
    }).join('\n\n');
  }

  // Gather references from query results
  async gatherReferencesForQuery(query: string): Promise<Reference[]> {
    try {
      const queryResult = await this.query({
        query,
        limit: 10,
        timeRange: {
          start: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
          end: new Date(),
        },
      });

      return queryResult.references || [];
    } catch (error) {
      logger.error('Failed to gather references for query:', error);
      return [];
    }
  }

  // Enhanced context gathering for financial queries
  async gatherContextForQuery(query: string): Promise<string> {
    try {
      const [queryResults, economicData, recentNews] = await Promise.allSettled([
        this.query({
          query,
          limit: 10,
          timeRange: {
            start: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
            end: new Date(),
          },
        }),
        this.getEconomicContext(),
        this.getNewsContext(query),
      ]);

      let context = 'CURRENT MARKET CONTEXT:\n\n';

      if (queryResults.status === 'fulfilled') {
        context += 'RELEVANT DATA:\n';
        context += this.formatForLLM(queryResults.value.results) + '\n\n';
      }

      if (economicData.status === 'fulfilled') {
        context += 'ECONOMIC INDICATORS:\n';
        context += this.formatForLLM(economicData.value) + '\n\n';
      }

      if (recentNews.status === 'fulfilled') {
        context += 'RECENT NEWS:\n';
        context += this.formatForLLM(recentNews.value) + '\n\n';
      }

      return context;
    } catch (error) {
      logger.error('Failed to gather context for query:', error);
      return 'Unable to gather current market context. Proceeding with general analysis.';
    }
  }
}

// Create singleton instance
export const dataService = new DataService(process.env.DATA_SERVICE_URL);