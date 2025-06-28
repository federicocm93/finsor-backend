# Finsor API

Backend service for the Finsor AI Financial Advisor providing GPT-4 powered financial analysis, market data, and news aggregation.

## Features

- **AI-Powered Analysis**: Uses GPT-4 to analyze financial queries and provide data-backed advice
- **Market Data Integration**: Real-time stock and cryptocurrency price data
- **News Aggregation**: Latest financial news from major sources (Reuters, Bloomberg, BBC, CNBC)
- **Risk Assessment**: Automated risk level evaluation for investment decisions
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Comprehensive Logging**: Winston-based logging for monitoring and debugging

## API Endpoints

### Financial Analysis
- `POST /api/analyze` - Analyze financial questions using AI
  ```json
  {
    "question": "Should I buy $1000 in Bitcoin? The price seems low right now"
  }
  ```

### Market Data
- `GET /api/market/stock/{symbol}` - Get stock price data
- `GET /api/market/crypto/{symbol}` - Get cryptocurrency price data

### News
- `GET /api/news` - Get latest financial news
- `GET /api/news?keyword=bitcoin&limit=5` - Search news by keyword

### Health Check
- `GET /health` - Service health status

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Set up your API keys in `.env`:
   - `OPENAI_API_KEY` - Your OpenAI API key (required)
   - `ALPHA_VANTAGE_API_KEY` - Your Alpha Vantage API key (optional)

4. Run in development mode:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4 access
- `ALPHA_VANTAGE_API_KEY` - Alpha Vantage API key for stock data
- `NODE_ENV` - Environment (development/production)

## Technology Stack

- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **OpenAI API** - AI-powered financial analysis
- **Alpha Vantage API** - Stock market data
- **CoinGecko API** - Cryptocurrency data
- **RSS Parser** - News aggregation
- **Winston** - Logging
- **Helmet** - Security middleware

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- Helmet security headers
- Request size limits
- Comprehensive error handling