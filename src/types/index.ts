export interface FinancialQuery {
  question: string;
  userId?: string;
}

export interface FinancialAnalysis {
  answer: string;
  confidence: number;
  sources: string[];
  riskLevel: 'low' | 'medium' | 'high';
  disclaimer: string;
  references: Reference[];
}

export interface Reference {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  url?: string;
  title?: string;
  symbol?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}