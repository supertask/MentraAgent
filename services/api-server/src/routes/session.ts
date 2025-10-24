/**
 * Session Router
 * セッション管理API
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { SessionRepository } from '../repositories/SessionRepository';
import { DatabaseService } from '../services/DatabaseService';

export const sessionRouter: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as DatabaseService;
  const sessionRepo = new SessionRepository(db);

  // セッション作成
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;

      logger.info('Creating new session', {
        userId: body.userId,
        deviceType: body.deviceType,
      });

      const session = await sessionRepo.create({
        userId: body.userId || 'anonymous',
        deviceType: body.deviceType || 'webcam',
        status: 'active',
        startTime: new Date(),
        context: {
          transcriptions: [],
          photos: [],
          locations: [],
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
        },
      });

      return {
        sessionId: session.sessionId,
        userId: session.userId,
        deviceType: session.deviceType,
        status: session.status,
        startTime: session.startTime,
      };
    } catch (error) {
      logger.error('Session creation error', error as Error);
      return reply.status(500).send({
        error: 'Failed to create session',
        message: (error as Error).message,
      });
    }
  });

  // セッション取得
  fastify.get('/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      logger.info('Fetching session', { sessionId });

      const session = await sessionRepo.findById(sessionId);

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return session;
    } catch (error) {
      logger.error('Session fetch error', error as Error);
      return reply.status(500).send({
        error: 'Failed to fetch session',
        message: (error as Error).message,
      });
    }
  });

  // セッション更新
  fastify.patch('/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;

      logger.info('Updating session', { sessionId, updates: body });

      const session = await sessionRepo.update(sessionId, {
        status: body.status,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      });

      return {
        sessionId: session.sessionId,
        status: session.status,
        updated: true,
      };
    } catch (error) {
      logger.error('Session update error', error as Error);
      return reply.status(500).send({
        error: 'Failed to update session',
        message: (error as Error).message,
      });
    }
  });

  // セッション終了
  fastify.delete('/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      logger.info('Ending session', { sessionId });

      // ステータスを'completed'に更新
      await sessionRepo.update(sessionId, {
        status: 'completed',
        endTime: new Date(),
      });

      return {
        sessionId,
        status: 'completed',
      };
    } catch (error) {
      logger.error('Session end error', error as Error);
      return reply.status(500).send({
        error: 'Failed to end session',
        message: (error as Error).message,
      });
    }
  });

  // セッション一覧
  fastify.get('/', async (request, reply) => {
    try {
      const { userId } = request.query as { userId?: string };

      logger.info('Fetching sessions', { userId });

      if (!userId) {
        return reply.status(400).send({ error: 'userId is required' });
      }

      const sessions = await sessionRepo.findByUserId(userId);

      return {
        sessions,
        count: sessions.length,
      };
    } catch (error) {
      logger.error('Sessions fetch error', error as Error);
      return reply.status(500).send({
        error: 'Failed to fetch sessions',
        message: (error as Error).message,
      });
    }
  });
};

