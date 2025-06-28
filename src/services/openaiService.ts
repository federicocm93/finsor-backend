import OpenAI from 'openai';
import { FinancialQuery, FinancialAnalysis } from '../types';
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
      const systemPrompt = `You are a financial advisor AI that provides data-backed investment advice. 
      Always include:
      1. A clear, actionable answer
      2. Risk assessment (low/medium/high)
      3. Data sources or reasoning
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
      
      // Simple risk level extraction based on keywords
      const riskLevel = this.extractRiskLevel(content);
      
      return {
        answer: content,
        confidence: 0.8, // Placeholder confidence score
        sources: ['OpenAI GPT-4 Analysis'],
        riskLevel,
        disclaimer: 'This is not personalized financial advice. Please consult with a qualified financial advisor before making investment decisions.'
      };
    } catch (error) {
      logger.error('Error in OpenAI analysis:', error);
      throw new Error('Failed to analyze financial query');
    }
  }

  private extractRiskLevel(content: string): 'low' | 'medium' | 'high' {
    const lowRiskKeywords = ['conservative', 'stable', 'low risk', 'safe'];
    const highRiskKeywords = ['volatile', 'high risk', 'speculative', 'risky'];
    
    const contentLower = content.toLowerCase();
    
    if (highRiskKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'high';
    }
    if (lowRiskKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }
}

export default OpenAIService;