import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse, CustomError } from '@/types';

// Development error response
const sendErrorDev = (err: CustomError, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: err.message,
    error: err.name,
    data: {
      stack: err.stack,
      statusCode: err.statusCode,
      isOperational: err.isOperational
    }
  };

  res.status(err.statusCode || 500).json(response);
};

// Production error response
const sendErrorProd = (err: CustomError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      error: err.name
    };

    res.status(err.statusCode || 500).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);

    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong!',
      error: 'INTERNAL_SERVER_ERROR'
    };

    res.status(500).json(response);
  }
};

// Handle cast errors (invalid MongoDB ObjectIds)
const handleCastErrorDB = (err: any): CustomError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  const error = new Error(message) as CustomError;
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

// Handle duplicate field errors
const handleDuplicateFieldsDB = (err: any): CustomError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  const error = new Error(message) as CustomError;
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

// Handle validation errors
const handleValidationErrorDB = (err: any): CustomError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  const error = new Error(message) as CustomError;
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

// Handle JWT errors
const handleJWTError = (): CustomError => {
  const error = new Error('Invalid token. Please log in again!') as CustomError;
  error.statusCode = 401;
  error.isOperational = true;
  return error;
};

const handleJWTExpiredError = (): CustomError => {
  const error = new Error('Your token has expired! Please log in again.') as CustomError;
  error.statusCode = 401;
  error.isOperational = true;
  return error;
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as CustomError;
  error.message = err.message;

  // Log error
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack
  });

  // MongoDB cast error
  if (err.name === 'CastError') error = handleCastErrorDB(err);

  // MongoDB duplicate key error
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);

  // MongoDB validation error
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

  // JWT error
  if (err.name === 'JsonWebTokenError') error = handleJWTError();

  // JWT expired error
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new Error('File too large') as CustomError;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Catch async errors
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Handle 404 errors
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new Error(message) as CustomError;
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

// Create application error
export const createError = (message: string, statusCode: number): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
