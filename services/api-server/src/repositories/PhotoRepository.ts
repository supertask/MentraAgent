/**
 * Photo Repository
 * 写真のCRUD操作
 */

import type { IPhotoRepository, PhotoData } from '@realworld-agent/shared';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export class PhotoRepository implements IPhotoRepository {
  constructor(private db: DatabaseService) {}

  async save(sessionId: string, photo: PhotoData): Promise<void> {
    try {
      const prisma = this.db.getClient();

      await prisma.photo.create({
        data: {
          sessionId,
          filename: photo.filename,
          storageKey: photo.requestId, // storageKeyとして使用
          mimeType: photo.mimeType,
          size: photo.size,
          timestamp: photo.timestamp,
        },
      });

      logger.info('写真をデータベースに保存しました', {
        sessionId,
        filename: photo.filename,
      });
    } catch (error) {
      logger.error('写真保存エラー', error as Error, {
        sessionId,
        filename: photo.filename,
      });
      throw error;
    }
  }

  async findBySessionId(sessionId: string): Promise<PhotoData[]> {
    try {
      const prisma = this.db.getClient();

      const photos = await prisma.photo.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
      });

      logger.debug('セッションの写真を取得しました', {
        sessionId,
        count: photos.length,
      });

      // PhotoDataに変換（bufferは含まない）
      return photos.map(
        (p) =>
          ({
            buffer: Buffer.from([]), // 空のBuffer（実際のデータは別途取得）
            mimeType: p.mimeType,
            filename: p.filename,
            requestId: p.storageKey,
            size: p.size,
            timestamp: p.timestamp,
          }) as PhotoData
      );
    } catch (error) {
      logger.error('セッション写真取得エラー', error as Error, { sessionId });
      throw error;
    }
  }

  async findById(photoId: string): Promise<PhotoData | null> {
    try {
      const prisma = this.db.getClient();

      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      if (!photo) {
        return null;
      }

      return {
        buffer: Buffer.from([]), // 空のBuffer
        mimeType: photo.mimeType,
        filename: photo.filename,
        requestId: photo.storageKey,
        size: photo.size,
        timestamp: photo.timestamp,
      } as PhotoData;
    } catch (error) {
      logger.error('写真取得エラー', error as Error, { photoId });
      throw error;
    }
  }
}

