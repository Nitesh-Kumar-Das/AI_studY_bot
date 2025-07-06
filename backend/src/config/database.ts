import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

interface ConnectionOptions {
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  bufferCommands: boolean;
}

class Database {
  private static instance: Database;
  private isConnected = false;

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('✅ Database already connected');
      return;
    }

    try {
      // Only use MongoDB Atlas
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }
      
      const options: ConnectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000, // Increased timeout for Atlas
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      mongoose.set('strictQuery', false);
      
      logger.info('🔄 Attempting to connect to MongoDB Atlas...');
      logger.info(`🌐 Database: ${mongoUri.split('@')[1]?.split('?')[0] || 'MongoDB Atlas'}`);
      
      await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      
      logger.info('✅ Database connected successfully to MongoDB Atlas');
      logger.info(`📊 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown'}`);
      logger.info(`🏷️  Database name: ${mongoose.connection.db?.databaseName || 'ai-study-app'}`);

      // Handle connection events
      mongoose.connection.on('error', (error: any) => {
        logger.error('❌ Database connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 Database reconnected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('connected', () => {
        logger.info('🔗 Database connection established');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Database disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!this.isConnected) {
        return { 
          status: 'error', 
          message: 'Database not connected',
          details: { 
            readyState: mongoose.connection.readyState,
            readyStateDescription: this.getReadyStateDescription(mongoose.connection.readyState)
          }
        };
      }

      if (mongoose.connection.db) {
        const pingResult = await mongoose.connection.db.admin().ping();
        return { 
          status: 'ok', 
          message: 'Database is healthy and responding',
          details: {
            databaseName: mongoose.connection.db.databaseName,
            readyState: mongoose.connection.readyState,
            readyStateDescription: this.getReadyStateDescription(mongoose.connection.readyState),
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            ping: pingResult
          }
        };
      }
      
      return { status: 'ok', message: 'Database connection established' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          readyState: mongoose.connection.readyState,
          readyStateDescription: this.getReadyStateDescription(mongoose.connection.readyState)
        }
      };
    }
  }

  private getReadyStateDescription(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state as keyof typeof states] || 'unknown';
  }
}

export const database = Database.getInstance();
export default database;
