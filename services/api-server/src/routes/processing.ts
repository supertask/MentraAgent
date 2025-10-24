/**
 * Processing Router
 * AI処理関連のAPI
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { ModalGPUService } from '../services/ModalGPUService';
import { SpecificationRepository } from '../repositories/SpecificationRepository';
import { TranscriptionRepository } from '../repositories/TranscriptionRepository';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { SessionRepository } from '../repositories/SessionRepository';

export const processingRouter: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as DatabaseService;
  const modalGPU = new ModalGPUService();
  const specRepo = new SpecificationRepository(db);
  const transcriptionRepo = new TranscriptionRepository(db);
  const photoRepo = new PhotoRepository(db);
  const sessionRepo = new SessionRepository(db);
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
    try {
      const body = request.body as any;
      const { sessionId } = body;

      if (!sessionId) {
        return reply.status(400).send({ error: 'sessionId is required' });
      }

      logger.info('Specification generation request', { sessionId });

      // セッションのコンテキストを取得
      const transcriptions = await transcriptionRepo.findBySessionId(sessionId);
      const photos = await photoRepo.findBySessionId(sessionId);

      logger.info('コンテキストを取得しました', {
        sessionId,
        transcriptionCount: transcriptions.length,
        photoCount: photos.length,
      });

      // コンテキストの整形
      const context = {
        transcriptions: transcriptions.map((t) => ({
          text: t.text,
          timestamp: t.timestamp,
          speaker: t.speaker,
        })),
        photos: photos.map((p) => ({
          filename: p.filename,
          storageKey: p.requestId,
          timestamp: p.timestamp,
        })),
      };

      // Modal GPUサーバーで仕様書を生成
      logger.info('Modal GPUサーバーで仕様書を生成中...', { sessionId });
      const generatedSpec = await modalGPU.generateSpecification(context);

      // セッションの存在確認（存在しない場合は作成）
      let session = await sessionRepo.findById(sessionId);
      if (!session) {
        session = await sessionRepo.create({
          userId: 'anonymous',
          deviceType: 'webcam',
          status: 'completed',
          metadata: {},
        });
        logger.info('仕様書用のセッションを作成しました', {
          oldSessionId: sessionId,
          newSessionId: session.sessionId,
        });
      }

      // データベースに保存
      const savedSpec = await specRepo.create({
        sessionId: session.sessionId,
        title: generatedSpec.title,
        summary: generatedSpec.content.substring(0, 500), // 最初の500文字を要約として
        content: {
          markdown: generatedSpec.content,
          model: generatedSpec.model,
          generatedAt: new Date().toISOString(),
          contextSummary: {
            transcriptionCount: transcriptions.length,
            photoCount: photos.length,
          },
        },
        status: 'draft',
      });

      logger.info('仕様書を生成・保存しました', {
        specificationId: savedSpec.id,
        sessionId,
        title: savedSpec.title,
      });

      return {
        specificationId: savedSpec.id,
        title: savedSpec.title,
        summary: savedSpec.summary,
        model: generatedSpec.model,
      };
    } catch (error) {
      logger.error('仕様書生成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate specification',
        message: (error as Error).message,
      });
    }
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

