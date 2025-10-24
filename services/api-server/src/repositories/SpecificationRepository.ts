/**
 * Specification Repository
 * 仕様書のCRUD操作
 */

import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export interface SpecificationData {
  id?: string;
  sessionId: string;
  title: string;
  summary: string;
  content: any; // JSON
  status?: 'draft' | 'review' | 'approved' | 'archived';
  slackUrl?: string;
  githubUrl?: string;
  notionUrl?: string;
}

export class SpecificationRepository {
  constructor(private db: DatabaseService) {}

  async create(spec: SpecificationData): Promise<SpecificationData> {
    try {
      const prisma = this.db.getClient();

      const created = await prisma.specification.create({
        data: {
          sessionId: spec.sessionId,
          title: spec.title,
          summary: spec.summary,
          content: spec.content,
          status: spec.status || 'draft',
          slackUrl: spec.slackUrl,
          githubUrl: spec.githubUrl,
          notionUrl: spec.notionUrl,
        },
      });

      logger.info('仕様書を作成しました', {
        specificationId: created.id,
        sessionId: spec.sessionId,
        title: spec.title,
      });

      return {
        id: created.id,
        sessionId: created.sessionId,
        title: created.title,
        summary: created.summary,
        content: created.content,
        status: created.status as any,
        slackUrl: created.slackUrl || undefined,
        githubUrl: created.githubUrl || undefined,
        notionUrl: created.notionUrl || undefined,
      };
    } catch (error) {
      logger.error('仕様書作成エラー', error as Error);
      throw error;
    }
  }

  async findById(id: string): Promise<SpecificationData | null> {
    try {
      const prisma = this.db.getClient();

      const spec = await prisma.specification.findUnique({
        where: { id },
      });

      if (!spec) {
        return null;
      }

      return {
        id: spec.id,
        sessionId: spec.sessionId,
        title: spec.title,
        summary: spec.summary,
        content: spec.content,
        status: spec.status as any,
        slackUrl: spec.slackUrl || undefined,
        githubUrl: spec.githubUrl || undefined,
        notionUrl: spec.notionUrl || undefined,
      };
    } catch (error) {
      logger.error('仕様書取得エラー', error as Error, { id });
      throw error;
    }
  }

  async findBySessionId(sessionId: string): Promise<SpecificationData[]> {
    try {
      const prisma = this.db.getClient();

      const specs = await prisma.specification.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });

      return specs.map((spec) => ({
        id: spec.id,
        sessionId: spec.sessionId,
        title: spec.title,
        summary: spec.summary,
        content: spec.content,
        status: spec.status as any,
        slackUrl: spec.slackUrl || undefined,
        githubUrl: spec.githubUrl || undefined,
        notionUrl: spec.notionUrl || undefined,
      }));
    } catch (error) {
      logger.error('セッション仕様書取得エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<SpecificationData>
  ): Promise<SpecificationData> {
    try {
      const prisma = this.db.getClient();

      const updated = await prisma.specification.update({
        where: { id },
        data: {
          title: data.title,
          summary: data.summary,
          content: data.content,
          status: data.status,
          slackUrl: data.slackUrl,
          githubUrl: data.githubUrl,
          notionUrl: data.notionUrl,
        },
      });

      logger.info('仕様書を更新しました', {
        specificationId: updated.id,
      });

      return {
        id: updated.id,
        sessionId: updated.sessionId,
        title: updated.title,
        summary: updated.summary,
        content: updated.content,
        status: updated.status as any,
        slackUrl: updated.slackUrl || undefined,
        githubUrl: updated.githubUrl || undefined,
        notionUrl: updated.notionUrl || undefined,
      };
    } catch (error) {
      logger.error('仕様書更新エラー', error as Error, { id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = this.db.getClient();

      await prisma.specification.delete({
        where: { id },
      });

      logger.info('仕様書を削除しました', { specificationId: id });
    } catch (error) {
      logger.error('仕様書削除エラー', error as Error, { id });
      throw error;
    }
  }
}

