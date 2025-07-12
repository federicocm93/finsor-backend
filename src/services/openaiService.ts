import OpenAI from 'openai';
import { FinancialQuery, FinancialAnalysis } from '../types';
import { dataService } from './dataService';
import logger from '../utils/logger';

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeFinancialQuery(query: FinancialQuery): Promise<FinancialAnalysis> {
    try {
      // Gather current market context from data service
      const marketContext = await dataService.gatherContextForQuery(query.question);
      
      const systemPrompt = `You are a financial advisor AI that provides data-backed investment advice using real-time market data.
      
      You have access to current market data, news, economic indicators, and trends. Use this information to provide informed analysis.
      
      Always include:
      1. A clear, actionable answer based on current data
      2. Risk assessment (low/medium/high) 
      3. Specific data sources and reasoning
      4. Current market conditions and trends
      5. Important disclaimers about financial advice
      
      Be objective, mention both risks and opportunities, cite specific data points when available, and always remind users that this is not personalized financial advice.
      
      Current Market Context:
      ${marketContext}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query.question }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Enhanced risk level extraction
      const riskLevel = this.extractRiskLevel(content);
      
      // Extract data sources mentioned in the response
      const sources = this.extractSources(content, marketContext);
      
      return {
        answer: content,
        confidence: 0.85, // Higher confidence with real-time data
        sources,
        riskLevel,
        disclaimer: 'This analysis is based on current market data but is not personalized financial advice. Please consult with a qualified financial advisor before making investment decisions.'
      };
    } catch (error) {
      logger.error('Error in OpenAI analysis:', error);
      
      // Fallback to basic analysis without data service
      return this.analyzeFinancialQueryFallback(query);
    }
  }

  private async analyzeFinancialQueryFallback(query: FinancialQuery): Promise<FinancialAnalysis> {
    try {
      const systemPrompt = `You are a financial advisor AI that provides general investment guidance. 
      Always include:
      1. A clear, actionable answer
      2. Risk assessment (low/medium/high)
      3. General market principles and reasoning
      4. Important disclaimers about financial advice
      
      Be objective, mention both risks and opportunities, and always remind users that this is not personalized financial advice.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query.question }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || '';
      
      return {
        answer: content,
        confidence: 0.7, // Lower confidence without real-time data
        sources: ['OpenAI GPT-4 Analysis', 'General Market Principles'],
        riskLevel: this.extractRiskLevel(content),
        disclaimer: 'This analysis is based on general market principles. For current market conditions, please consult recent financial data. This is not personalized financial advice.'
      };
    } catch (error) {
      logger.error('Error in fallback OpenAI analysis:', error);
      throw new Error('Failed to analyze financial query');
    }
  }

  private extractRiskLevel(content: string): 'low' | 'medium' | 'high' {
    const lowRiskKeywords = ['conservative', 'stable', 'low risk', 'safe', 'treasury', 'bonds', 'dividend'];
    const highRiskKeywords = ['volatile', 'high risk', 'speculative', 'risky', 'cryptocurrency', 'startup', 'leverage'];
    
    const contentLower = content.toLowerCase();
    
    if (highRiskKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'high';
    }
    if (lowRiskKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private extractSources(content: string, marketContext: string): string[] {
    const sources = ['OpenAI GPT-4 Analysis'];
    
    // Add data sources based on market context
    if (marketContext.includes('CRYPTO')) {
      sources.push('CoinGecko API');
    }
    if (marketContext.includes('STOCK')) {
      sources.push('Alpha Vantage');
    }
    if (marketContext.includes('NEWS')) {
      sources.push('Financial News Feeds');
    }
    if (marketContext.includes('ECONOMIC')) {
      sources.push('FRED Economic Data');
    }
    if (marketContext.includes('TRENDS')) {
      sources.push('Google Trends');
    }
    
    return sources;
  }
}

export default OpenAIService;