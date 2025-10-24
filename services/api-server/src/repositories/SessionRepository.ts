/**
 * Session Repository
 * セッションのCRUD操作
 */

import type { ISessionRepository, SessionData } from '@realworld-agent/shared';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export class SessionRepository implements ISessionRepository {
  constructor(private db: DatabaseService) {}

  async create(session: Omit<SessionData, 'sessionId'>): Promise<SessionData> {
    try {
      const prisma = this.db.getClient();

      const created = await prisma.session.create({
        data: {
          userId: session.userId,
          deviceType: session.deviceType,
          status: session.status || 'active',
          startTime: session.startTime,
          endTime: session.endTime,
        },
      });

      logger.info('セッションを作成しました', {
        sessionId: created.id,
        userId: created.userId,
      });

      return this.mapToSessionData(created);
    } catch (error) {
      logger.error('セッション作成エラー', error as Error);
      throw error;
    }
  }

  async findById(sessionId: string): Promise<SessionData | null> {
    try {
      const prisma = this.db.getClient();

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          transcriptions: true,
          photos: true,
          locations: true,
          importantMoments: true,
        },
      });

      if (!session) {
        return null;
      }

      return this.mapToSessionData(session);
    } catch (error) {
      logger.error('セッション取得エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async update(
    sessionId: string,
    data: Partial<SessionData>
  ): Promise<SessionData> {
    try {
      const prisma = this.db.getClient();

      const updated = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: data.status,
          endTime: data.endTime,
        },
      });

      logger.info('セッションを更新しました', {
        sessionId: updated.id,
        status: updated.status,
      });

      return this.mapToSessionData(updated);
    } catch (error) {
      logger.error('セッション更新エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const prisma = this.db.getClient();

      await prisma.session.delete({
        where: { id: sessionId },
      });

      logger.info('セッションを削除しました', { sessionId });
    } catch (error) {
      logger.error('セッション削除エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<SessionData[]> {
    try {
      const prisma = this.db.getClient();

      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 50, // 最新50件
      });

      return sessions.map((s) => this.mapToSessionData(s));
    } catch (error) {
      logger.error('ユーザーセッション取得エラー', error as Error, { userId });
      throw error;
    }
  }

  private mapToSessionData(session: any): SessionData {
    return {
      sessionId: session.id,
      userId: session.userId,
      deviceType: session.deviceType as 'mentra' | 'webcam',
      status: session.status as 'active' | 'paused' | 'completed' | 'error',
      startTime: session.startTime,
      endTime: session.endTime,
      context: {
        transcriptions: session.transcriptions || [],
        photos: session.photos || [],
        locations: session.locations || [],
        timeRange: {
          start: session.startTime,
          end: session.endTime || new Date(),
        },
      },
    };
  }
}

