import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import configurations and middleware
import { database } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import materialsRoutes from './routes/materials.js';
import summariesRoutes from './routes/summaries.js';
import quizzesRoutes from './routes/quizzes.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '5000', 10);
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parser middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Request logging
    this.app.use((req: Request, res: Response, next: express.NextFunction) => {
      logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const dbHealth = await database.healthCheck();
        const isHealthy = dbHealth.status === 'ok';
        
        res.status(isHealthy ? 200 : 503).json({
          success: isHealthy,
          message: isHealthy ? 'Server and database are healthy' : 'Server is running but database has issues',
          data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: dbHealth,
            server: {
              status: 'ok',
              message: 'Server is running'
            }
          }
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          message: 'Health check failed',
          data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: {
              status: 'error',
              message: 'Unable to check database status'
            },
            server: {
              status: 'ok',
              message: 'Server is running'
            }
          }
        });
      }
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/materials', materialsRoutes);
    this.app.use('/api/summaries', summariesRoutes);
    this.app.use('/api/quizzes', quizzesRoutes);
    this.app.use('/api/ai', aiRoutes);

    // API documentation
    this.app.get('/api', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'AI Study App API',
        data: {
          version: '1.0.0',
          endpoints: {
            auth: '/api/auth',
            materials: '/api/materials',
            summaries: '/api/summaries',
            quizzes: '/api/quizzes',
            ai: '/api/ai',
            schedule: '/api/schedule',
            analytics: '/api/analytics',
            users: '/api/users'
          },
          documentation: 'See README.md for detailed API documentation'
        }
      });
    });

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to AI Study App API',
        data: {
          version: '1.0.0',
          status: 'running',
          documentation: '/api'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // Handle 404 routes
    this.app.use('*', notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Try to connect to database, but don't fail if it's not available
      try {
        await database.connect();
      } catch (error) {
        logger.warn('⚠️  Database connection failed, starting server without database:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 API Documentation: http://localhost:${this.port}/api`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      try {
        // Close database connection
        await database.disconnect();
        logger.info('✅ Database disconnected');
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: any) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: any) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

export default Server;
