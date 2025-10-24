/**
 * Processing Router
 * AI処理関連のAPI
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';

export const processingRouter: FastifyPluginAsync = async (fastify) => {
  // 文字起こし（バッチ）
  fastify.post('/transcribe', async (request, reply) => {
    const body = request.body as any;

    logger.info('Transcription request', {
      sessionId: body.sessionId,
    });

    // TODO: GPU処理実装

    return {
      transcription: 'Mock transcription',
      confidence: 0.95,
    };
  });

  // 画像分析
  fastify.post('/analyze-image', async (request, reply) => {
    const body = request.body as any;

    logger.info('Image analysis request', {
      sessionId: body.sessionId,
    });

    // TODO: Vision処理実装

    return {
      description: 'Mock image description',
      objects: [],
    };
  });

  // 仕様書生成
  fastify.post('/generate-spec', async (request, reply) => {
    const body = request.body as any;

    logger.info('Specification generation request', {
      sessionId: body.sessionId,
    });

    // TODO: 仕様書生成実装

    return {
      specificationId: 'mock-spec-id',
      title: 'Mock Specification',
    };
  });

  // コード生成
  fastify.post('/generate-code', async (request, reply) => {
    const body = request.body as any;

    logger.info('Code generation request', {
      sessionId: body.sessionId,
    });

    // TODO: コード生成実装

    return {
      files: [],
      dependencies: [],
    };
  });
};

