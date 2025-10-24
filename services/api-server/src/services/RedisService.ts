/**
 * Redis Service
 * キャッシングとリアルタイム通信用
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config';

export class RedisService {
  private client: Redis | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      logger.warn('Redis already connected');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (error) => {
        logger.error('Redis error', error);
      });

      this.client.on('close', () => {
        this.connected = false;
        logger.warn('Redis connection closed');
      });

      // 接続待機
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 5000);

        this.client!.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.client!.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Failed to disconnect from Redis', error as Error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed', error as Error);
      return false;
    }
  }

  getClient(): Redis {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  // キャッシュ操作のヘルパーメソッド
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to parse Redis value', error as Error, { key });
      return null;
    }
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  // Pub/Sub
  async publish(channel: string, message: any): Promise<void> {
    const client = this.getClient();
    await client.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<() => void> {
    const subscriber = this.client!.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(msg);
          callback(parsed);
        } catch (error) {
          logger.error('Failed to parse Redis pub/sub message', error as Error);
        }
      }
    });

    // unsubscribe関数を返す
    return async () => {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    };
  }
}

