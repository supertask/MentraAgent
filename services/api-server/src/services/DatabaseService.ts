/**
 * Database Service
 * Prismaを使用したデータベース接続管理
 */

import { PrismaClient } from '@prisma/client';
import type { IDatabase } from '@realworld-agent/shared';
import { logger } from '../utils/logger';

export class DatabaseService implements IDatabase {
  public prisma: PrismaClient | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      logger.warn('Database already connected');
      return;
    }

    try {
      this.prisma = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // ログイベントの設定
      this.prisma.$on('query' as never, (e: any) => {
        if (process.env.LOG_LEVEL === 'debug') {
          logger.debug('Database query', {
            query: e.query,
            params: e.params,
            duration: e.duration,
          });
        }
      });

      this.prisma.$on('error' as never, (e: any) => {
        logger.error('Database error', new Error(e.message));
      });

      this.prisma.$on('warn' as never, (e: any) => {
        logger.warn('Database warning', { message: e.message });
      });

      // 接続テスト
      await this.prisma.$connect();
      this.connected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.prisma) {
      return;
    }

    try {
      await this.prisma.$disconnect();
      this.connected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Failed to disconnect from database', error as Error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.prisma || !this.connected) {
      return false;
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  getClient(): PrismaClient {
    if (!this.prisma || !this.connected) {
      throw new Error('Database not connected');
    }
    return this.prisma;
  }
}

