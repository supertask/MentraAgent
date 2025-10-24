/**
 * Webhook Router
 * 外部サービスからのWebhook受信
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';

export const webhookRouter: FastifyPluginAsync = async (fastify) => {
  // Slack Webhook
  fastify.post('/slack', async (request, reply) => {
    const body = request.body as any;

    logger.info('Slack webhook received', {
      type: body.type,
    });

    // TODO: Slack Webhook処理

    return { ok: true };
  });

  // GitHub Webhook
  fastify.post('/github', async (request, reply) => {
    const body = request.body as any;

    logger.info('GitHub webhook received', {
      action: body.action,
    });

    // TODO: GitHub Webhook処理

    return { ok: true };
  });

  // Notion Webhook
  fastify.post('/notion', async (request, reply) => {
    const body = request.body as any;

    logger.info('Notion webhook received', {
      type: body.type,
    });

    // TODO: Notion Webhook処理

    return { ok: true };
  });
};

