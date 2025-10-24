/**
 * Device Router
 * デバイス（Mentra/Webcam）からの入力を受信
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { StorageService } from '../services/StorageService';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { DatabaseService } from '../services/DatabaseService';
import type { PhotoData } from '@realworld-agent/shared';

export const deviceRouter: FastifyPluginAsync = async (fastify) => {
  const storage = new StorageService();
  const db = fastify.db as DatabaseService;
  const photoRepo = new PhotoRepository(db);

  // WebSocket: Webカメラからのリアルタイムストリーム
  fastify.get('/webcam/stream', { websocket: true }, (socket, request) => {
    const clientId = request.headers['sec-websocket-key'] || 'unknown';

    logger.info('Webcam stream connected', { clientId });

    socket.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        logger.debug('Received webcam message', {
          type: data.type,
          size: message.length,
        });

        // メッセージタイプ別処理
        if (data.type === 'transcription') {
          // 文字起こしデータの処理
          logger.info('文字起こし受信', {
            text: data.data.text,
            isFinal: data.data.isFinal,
          });

          // TODO: TranscriptionRepositoryに保存
        } else if (data.type === 'ping') {
          // Ping/Pong
          socket.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        logger.error('Webcam message parse error', error as Error);
      }
    });

    socket.on('close', () => {
      logger.info('Webcam stream disconnected', { clientId });
    });

    socket.on('error', (error) => {
      logger.error('Webcam stream error', error, { clientId });
    });
  });

  // REST: 写真アップロード
  fastify.post('/photo', async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const sessionId =
        (data.fields.sessionId as any)?.value ||
        `session-${Date.now()}`;

      logger.info('Photo uploaded', {
        filename: data.filename,
        mimetype: data.mimetype,
        size: buffer.length,
        sessionId,
      });

      // ストレージに保存
      const { key, url } = await storage.savePhoto(
        sessionId,
        data.filename,
        buffer,
        {
          mimetype: data.mimetype,
          uploadedAt: new Date().toISOString(),
        }
      );

      // データベースに記録
      const photoData: PhotoData = {
        buffer,
        mimeType: data.mimetype,
        filename: data.filename,
        requestId: key,
        size: buffer.length,
        timestamp: new Date(),
      };

      await photoRepo.save(sessionId, photoData);

      return {
        success: true,
        filename: data.filename,
        key,
        url,
        size: buffer.length,
      };
    } catch (error) {
      logger.error('Photo upload error', error as Error);
      return reply.status(500).send({
        error: 'Failed to upload photo',
        message: (error as Error).message,
      });
    }
  });

  // デバイス情報取得
  fastify.get('/info', async (request, reply) => {
    return {
      type: 'webcam',
      capabilities: {
        hasCamera: true,
        hasMicrophone: true,
        hasSpeaker: false,
        hasDisplay: false,
        hasLocation: false,
      },
      storage: {
        type: storage.getType(),
      },
    };
  });
};

