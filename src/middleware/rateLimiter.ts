import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 500, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      next();
      return;
    }

    if (this.store[key].count >= this.maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        timestamp: new Date()
      } as ApiResponse<never>);
      return;
    }

    this.store[key].count++;
    next();
  };

  cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

export default RateLimiter;