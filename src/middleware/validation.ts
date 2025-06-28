import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const validateFinancialQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { question } = req.body;

  if (!question) {
    res.status(400).json({
      success: false,
      error: 'Question is required',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  if (typeof question !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Question must be a string',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  if (question.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Question cannot be empty',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  if (question.length > 1000) {
    res.status(400).json({
      success: false,
      error: 'Question is too long (max 1000 characters)',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  next();
};

export const validateSymbol = (req: Request, res: Response, next: NextFunction): void => {
  const { symbol } = req.params;

  if (!symbol) {
    res.status(400).json({
      success: false,
      error: 'Symbol is required',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  if (!/^[A-Za-z0-9-]+$/.test(symbol)) {
    res.status(400).json({
      success: false,
      error: 'Invalid symbol format',
      timestamp: new Date()
    } as ApiResponse<never>);
    return;
  }

  next();
};