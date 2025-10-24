/**
 * Modal GPU Service
 * Modal GPUサーバーとの通信
 */

import { config } from '../config';
import { logger } from '../utils/logger';

export class ModalGPUService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = config.ai.modal?.apiUrl || '';
    
    if (!this.apiUrl) {
      logger.warn('Modal API URLが設定されていません');
    }
  }

  /**
   * 仕様書生成
   */
  async generateSpecification(context: {
    transcriptions: Array<{ text: string; timestamp: Date; speaker?: string }>;
    photos: Array<{ filename: string; storageKey: string; timestamp: Date }>;
  }): Promise<{
    title: string;
    content: string;
    model: string;
  }> {
    try {
      if (!this.apiUrl) {
        throw new Error('Modal API URLが設定されていません');
      }

      logger.info('Modal GPUサーバーに仕様書生成をリクエスト', {
        transcriptionCount: context.transcriptions.length,
        photoCount: context.photos.length,
      });

      // Modal GPUサーバーのgenerate_specificationエンドポイントを呼び出し
      // 注: modal_app.pyのRealworldAgentGPU.generate_specificationメソッドを呼び出す
      // コールドスタート対策として10分のタイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10分
      
      try {
        const response = await fetch(`${this.apiUrl}/generate-spec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Modal API Error: ${response.status} - ${errorText}`);
        }
        
        return await response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Modal GPU server timeout (10 minutes). The server may be cold starting.');
        }
        throw error;
      }
    } catch (error) {
      logger.error('Modal仕様書生成エラー', error as Error);
      throw error;
    }
  }

  /**
   * コード生成
   */
  async generateCode(request: {
    prompt: string;
    context: {
      transcriptions: Array<{ text: string; timestamp: Date; speaker?: string }>;
      specification?: string;
    };
    language?: string;
    framework?: string;
  }): Promise<{
    files: Array<{ path: string; content: string; language: string }>;
    dependencies: string[];
    instructions: string;
    model: string;
  }> {
    try {
      if (!this.apiUrl) {
        throw new Error('Modal API URLが設定されていません');
      }

      logger.info('Modal GPUサーバーにコード生成をリクエスト', {
        prompt: request.prompt.substring(0, 100),
        language: request.language,
        framework: request.framework,
      });

      // Modal GPUサーバーのgenerate_codeエンドポイントを呼び出し
      // コールドスタート対策として10分のタイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10分

      try {
        const response = await fetch(`${this.apiUrl}/api/generate-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Modal API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        logger.info('コード生成完了', {
          model: result.model,
          fileCount: result.files.length,
        });

        return result;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Modal GPU server timeout (10 minutes). The server may be cold starting.');
        }
        throw error;
      }
    } catch (error) {
      logger.error('Modalコード生成エラー', error as Error);
      throw error;
    }
  }

  /**
   * 画像分析
   */
  async analyzeImage(imageBuffer: Buffer): Promise<{
    analysis: string;
    model: string;
  }> {
    try {
      if (!this.apiUrl) {
        throw new Error('Modal API URLが設定されていません');
      }

      logger.info('Modal GPUサーバーに画像分析をリクエスト');

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'image.jpg');

      const response = await fetch(`${this.apiUrl}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modal API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      logger.info('画像分析完了', {
        model: result.model,
      });

      return result;
    } catch (error) {
      logger.error('Modal画像分析エラー', error as Error);
      throw error;
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiUrl) {
        return false;
      }

      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      logger.error('Modal healthcheck error', error as Error);
      return false;
    }
  }
}

