import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import FinancialController from './controllers/financialController';
import { validateFinancialQuery, validateSymbol } from './middleware/validation';
import RateLimiter from './middleware/rateLimiter';
import logger from './utils/logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const financialController = new FinancialController();
const rateLimiter = new RateLimiter();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter.middleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// API Routes
app.post('/api/analyze', validateFinancialQuery, async (req, res) => {
  await financialController.analyzeQuery(req, res);
});

app.get('/api/market/stock/:symbol', validateSymbol, async (req, res) => {
  req.params.type = 'stock';
  await financialController.getMarketData(req, res);
});

app.get('/api/market/crypto/:symbol', validateSymbol, async (req, res) => {
  req.params.type = 'crypto';
  await financialController.getMarketData(req, res);
});

app.get('/api/news', async (req, res) => {
  await financialController.getNews(req, res);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date()
  });
});

// Cleanup interval for rate limiter
setInterval(() => {
  rateLimiter.cleanup();
}, 60000); // Clean up every minute

app.listen(port, () => {
  logger.info(`Financial Advisor API server running on port ${port}`);
  logger.info(`Health check available at: http://localhost:${port}/health`);
});

export default app;