/**
 * Transcription Repository
 * 文字起こしのCRUD操作
 */

import type {
  ITranscriptionRepository,
  TranscriptionData,
} from '@realworld-agent/shared';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export class TranscriptionRepository implements ITranscriptionRepository {
  constructor(private db: DatabaseService) {}

  async save(
    sessionId: string,
    transcription: TranscriptionData
  ): Promise<void> {
    try {
      const prisma = this.db.getClient();

      await prisma.transcription.create({
        data: {
          sessionId,
          text: transcription.text,
          isFinal: transcription.isFinal,
          confidence: transcription.confidence,
          language: transcription.language,
          timestamp: transcription.timestamp,
        },
      });

      logger.debug('文字起こしをデータベースに保存しました', {
        sessionId,
        textLength: transcription.text.length,
      });
    } catch (error) {
      logger.error('文字起こし保存エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async findBySessionId(sessionId: string): Promise<TranscriptionData[]> {
    try {
      const prisma = this.db.getClient();

      const transcriptions = await prisma.transcription.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });

      logger.debug('セッションの文字起こしを取得しました', {
        sessionId,
        count: transcriptions.length,
      });

      return transcriptions.map((t) => ({
        text: t.text,
        isFinal: t.isFinal,
        timestamp: t.timestamp,
        confidence: t.confidence || undefined,
        language: t.language || undefined,
      }));
    } catch (error) {
      logger.error('セッション文字起こし取得エラー', error as Error, {
        sessionId,
      });
      throw error;
    }
  }

  async findByTimeRange(
    sessionId: string,
    start: Date,
    end: Date
  ): Promise<TranscriptionData[]> {
    try {
      const prisma = this.db.getClient();

      const transcriptions = await prisma.transcription.findMany({
        where: {
          sessionId,
          timestamp: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      logger.debug('時間範囲の文字起こしを取得しました', {
        sessionId,
        start,
        end,
        count: transcriptions.length,
      });

      return transcriptions.map((t) => ({
        text: t.text,
        isFinal: t.isFinal,
        timestamp: t.timestamp,
        confidence: t.confidence || undefined,
        language: t.language || undefined,
      }));
    } catch (error) {
      logger.error('時間範囲文字起こし取得エラー', error as Error, {
        sessionId,
        start,
        end,
      });
      throw error;
    }
  }
}

