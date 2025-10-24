/**
 * Context Manager Service
 * API Server用のコンテキスト管理
 */

import type {
  IContextManager,
  TranscriptionItem,
  PhotoItem,
  LocationItem,
  ContextData,
} from '@realworld-agent/shared';
import { logger } from '../utils/logger';

export class ContextManager implements IContextManager {
  private transcriptions: Map<string, TranscriptionItem[]> = new Map();
  private photos: Map<string, PhotoItem[]> = new Map();
  private locations: Map<string, LocationItem[]> = new Map();

  private readonly maxBufferSize = 100;
  private readonly contextWindowMs = 300000; // 5分

  addTranscription(transcription: TranscriptionItem): void {
    // このメソッドは使用されない（セッションIDベース）
  }

  addPhoto(photo: PhotoItem): void {
    // このメソッドは使用されない（セッションIDベース）
  }

  addLocation(location: LocationItem): void {
    // このメソッドは使用されない（セッションIDベース）
  }

  getContext(timeWindowMs?: number): ContextData {
    // このメソッドは使用されない（セッションIDベース）
    return {
      transcriptions: [],
      photos: [],
      locations: [],
      timeRange: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  clear(): void {
    this.transcriptions.clear();
    this.photos.clear();
    this.locations.clear();
  }

  getBuffer<T extends 'transcriptions' | 'photos' | 'locations'>(type: T): any[] {
    return [];
  }

  // セッションベースのメソッド

  addSessionTranscription(sessionId: string, transcription: TranscriptionItem): void {
    if (!this.transcriptions.has(sessionId)) {
      this.transcriptions.set(sessionId, []);
    }
    this.transcriptions.get(sessionId)!.push(transcription);
    this.cleanupSession(sessionId);
  }

  addSessionPhoto(sessionId: string, photo: PhotoItem): void {
    if (!this.photos.has(sessionId)) {
      this.photos.set(sessionId, []);
    }
    this.photos.get(sessionId)!.push(photo);
    this.cleanupSession(sessionId);
  }

  addSessionLocation(sessionId: string, location: LocationItem): void {
    if (!this.locations.has(sessionId)) {
      this.locations.set(sessionId, []);
    }
    this.locations.get(sessionId)!.push(location);
    this.cleanupSession(sessionId);
  }

  getSessionContext(sessionId: string, timeWindowMs?: number): ContextData {
    const window = timeWindowMs || this.contextWindowMs;
    const now = Date.now();
    const cutoff = now - window;

    const transcriptions = this.transcriptions.get(sessionId) || [];
    const photos = this.photos.get(sessionId) || [];
    const locations = this.locations.get(sessionId) || [];

    return {
      transcriptions: transcriptions.filter(
        (t) => t.timestamp.getTime() > cutoff
      ),
      photos: photos.filter((p) => p.timestamp.getTime() > cutoff),
      locations: locations.filter((l) => l.timestamp.getTime() > cutoff),
      timeRange: {
        start: new Date(cutoff),
        end: new Date(now),
      },
    };
  }

  clearSession(sessionId: string): void {
    this.transcriptions.delete(sessionId);
    this.photos.delete(sessionId);
    this.locations.delete(sessionId);
    logger.info(`コンテキストクリア: ${sessionId}`);
  }

  private cleanupSession(sessionId: string): void {
    const now = Date.now();
    const cutoff = now - this.contextWindowMs;

    // 古いデータを削除
    const transcriptions = this.transcriptions.get(sessionId) || [];
    this.transcriptions.set(
      sessionId,
      transcriptions
        .filter((t) => t.timestamp.getTime() > cutoff)
        .slice(-this.maxBufferSize)
    );

    const photos = this.photos.get(sessionId) || [];
    this.photos.set(
      sessionId,
      photos
        .filter((p) => p.timestamp.getTime() > cutoff)
        .slice(-this.maxBufferSize)
    );

    const locations = this.locations.get(sessionId) || [];
    this.locations.set(
      sessionId,
      locations
        .filter((l) => l.timestamp.getTime() > cutoff)
        .slice(-this.maxBufferSize)
    );
  }
}

