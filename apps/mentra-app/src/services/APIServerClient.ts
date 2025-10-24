/**
 * API Server Client
 * APIサーバーとの通信
 */

import type {
  TranscriptionData,
  PhotoData,
  ImportantMoment,
  ContextData,
} from '@realworld-agent/shared';

export class APIServerClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_SERVER_URL || 'http://localhost:3000';
  }

  /**
   * セッション作成
   */
  async createSession(data: {
    sessionId: string;
    userId: string;
    deviceType: string;
  }): Promise<void> {
    try {
      await this.post('/api/session', data);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }

  /**
   * 文字起こし送信
   */
  async sendTranscription(
    sessionId: string,
    transcription: TranscriptionData
  ): Promise<void> {
    try {
      await this.post(`/api/session/${sessionId}/transcription`, transcription);
    } catch (error) {
      console.error('Failed to send transcription:', error);
    }
  }

  /**
   * 重要箇所送信
   */
  async sendImportantMoment(
    sessionId: string,
    moment: ImportantMoment
  ): Promise<void> {
    try {
      await this.post(`/api/session/${sessionId}/important-moment`, moment);
    } catch (error) {
      console.error('Failed to send important moment:', error);
    }
  }

  /**
   * 写真送信
   */
  async sendPhoto(
    sessionId: string,
    photo: PhotoData,
    reason: string
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([photo.buffer]), photo.filename);
      formData.append('reason', reason);
      formData.append('timestamp', photo.timestamp.toISOString());

      await fetch(`${this.baseUrl}/api/session/${sessionId}/photo`, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Failed to send photo:', error);
    }
  }

  /**
   * 仕様書生成依頼
   */
  async generateSpecification(
    sessionId: string,
    context: ContextData
  ): Promise<{ title: string; specificationId: string }> {
    try {
      const response = await this.post(`/api/processing/generate-spec`, {
        sessionId,
        context,
      });
      return response;
    } catch (error) {
      console.error('Failed to generate specification:', error);
      throw error;
    }
  }

  /**
   * セッション終了
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/session/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * POSTリクエストヘルパー
   */
  private async post(path: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

