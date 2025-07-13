import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied. No token provided.',
        error: 'AUTHENTICATION_REQUIRED'
      };
      res.status(401).json(response);
      return;
    }

    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      // Get user from database
      const user = await User.findById(decoded.id).select('+password');
      if (!user || !user.isActive) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid token. User not found or inactive.',
          error: 'INVALID_TOKEN'
        };
        res.status(401).json(response);
        return;
      }

      // Update last active
      user.lastActive = new Date();
      await user.save({ validateBeforeSave: false });

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid token.',
        error: 'INVALID_TOKEN'
      };
      res.status(401).json(response);
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Authentication failed.',
      error: 'AUTHENTICATION_ERROR'
    };
    res.status(500).json(response);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      next();
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        next();
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      logger.warn('Optional authentication failed:', jwtError);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      };
      res.status(401).json(response);
      return;
    }

    // For now, we don't have roles in the user model
    // This can be extended later if role-based access is needed
    next();
  };
};

export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { id: userId }, 
    jwtSecret, 
    { expiresIn: jwtExpiresIn } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
};
