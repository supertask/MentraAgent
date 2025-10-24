/**
 * API Server Entry Point
 * 統合APIサーバー - MentraOS/Webカメラ入力の受信とGPU処理の統合
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { config } from './config';
import { logger } from './utils/logger';
import { deviceRouter } from './routes/device';
import { sessionRouter } from './routes/session';
import { processingRouter } from './routes/processing';
import { webhookRouter } from './routes/webhook';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';

const fastify = Fastify({
  logger: false, // Winston を使用
  bodyLimit: 50 * 1024 * 1024, // 50MB
});

// プラグインの登録
await fastify.register(cors, {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
});

await fastify.register(websocket, {
  options: {
    maxPayload: 10 * 1024 * 1024, // 10MB
  },
});

await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// サービスの初期化
const dbService = new DatabaseService();
const redisService = new RedisService();

// サービスをfastifyインスタンスにデコレート
fastify.decorate('db', dbService);
fastify.decorate('redis', redisService);

// ルートの登録
await fastify.register(deviceRouter, { prefix: '/api/device' });
await fastify.register(sessionRouter, { prefix: '/api/sessions' });
await fastify.register(processingRouter, { prefix: '/api/processing' });
await fastify.register(webhookRouter, { prefix: '/api/webhook' });

// ヘルスチェック
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await dbService.isHealthy(),
      redis: await redisService.isHealthy(),
    },
  };
});

// ルート
fastify.get('/', async () => {
  return {
    name: 'Realworld Agent API Server',
    version: '0.1.0',
    endpoints: [
      '/api/device',
      '/api/session',
      '/api/processing',
      '/api/webhook',
      '/health',
    ],
  };
});

// エラーハンドラー
fastify.setErrorHandler((error, request, reply) => {
  logger.error('Request error', error, {
    method: request.method,
    url: request.url,
  });

  reply.status(error.statusCode || 500).send({
    error: {
      message: error.message,
      statusCode: error.statusCode || 500,
    },
  });
});

// グレースフルシャットダウン
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await fastify.close();
    await dbService.disconnect();
    await redisService.disconnect();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', err as Error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// サーバー起動
const start = async () => {
  try {
    // データベース接続
    await dbService.connect();
    logger.info('Database connected');

    // Redis接続
    await redisService.connect();
    logger.info('Redis connected');

    // サーバー起動
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `🚀 API Server listening on http://${config.server.host}:${config.server.port}`
    );
    logger.info(`📝 Environment: ${config.env}`);
    logger.info(`🎯 Input Device: ${config.device.type}`);
  } catch (err) {
    logger.error('Failed to start server', err as Error);
    process.exit(1);
  }
};

start();

