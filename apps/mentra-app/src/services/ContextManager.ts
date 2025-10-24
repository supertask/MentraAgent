/**
 * Context Manager
 * 音声・画像・位置情報の統合管理
 */

import type {
  IContextManager,
  TranscriptionItem,
  PhotoItem,
  LocationItem,
  ContextData,
} from '@realworld-agent/shared';

export class ContextManager implements IContextManager {
  private transcriptions: TranscriptionItem[] = [];
  private photos: PhotoItem[] = [];
  private locations: LocationItem[] = [];

  private readonly maxBufferSize = 100;
  private readonly contextWindowMs = 300000; // 5分

  addTranscription(transcription: TranscriptionItem): void {
    this.transcriptions.push(transcription);
    this.cleanupOldData();
  }

  addPhoto(photo: PhotoItem): void {
    this.photos.push(photo);
    this.cleanupOldData();
  }

  addLocation(location: LocationItem): void {
    this.locations.push(location);
    this.cleanupOldData();
  }

  getContext(timeWindowMs?: number): ContextData {
    const window = timeWindowMs || this.contextWindowMs;
    const now = Date.now();
    const cutoff = now - window;

    return {
      transcriptions: this.transcriptions.filter(
        (t) => t.timestamp.getTime() > cutoff
      ),
      photos: this.photos.filter((p) => p.timestamp.getTime() > cutoff),
      locations: this.locations.filter((l) => l.timestamp.getTime() > cutoff),
      timeRange: {
        start: new Date(cutoff),
        end: new Date(now),
      },
    };
  }

  clear(): void {
    this.transcriptions = [];
    this.photos = [];
    this.locations = [];
  }

  getBuffer<T extends 'transcriptions' | 'photos' | 'locations'>(type: T): any[] {
    switch (type) {
      case 'transcriptions':
        return this.transcriptions;
      case 'photos':
        return this.photos;
      case 'locations':
        return this.locations;
      default:
        return [];
    }
  }

  /**
   * 古いデータをクリーンアップ
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const cutoff = now - this.contextWindowMs;

    // 時間外のデータを削除
    this.transcriptions = this.transcriptions.filter(
      (t) => t.timestamp.getTime() > cutoff
    );
    this.photos = this.photos.filter((p) => p.timestamp.getTime() > cutoff);
    this.locations = this.locations.filter((l) => l.timestamp.getTime() > cutoff);

    // バッファサイズ制限
    if (this.transcriptions.length > this.maxBufferSize) {
      this.transcriptions = this.transcriptions.slice(-this.maxBufferSize);
    }
    if (this.photos.length > this.maxBufferSize) {
      this.photos = this.photos.slice(-this.maxBufferSize);
    }
    if (this.locations.length > this.maxBufferSize) {
      this.locations = this.locations.slice(-this.maxBufferSize);
    }
  }
}

