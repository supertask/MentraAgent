/**
 * Storage Service
 * 写真やファイルの保存（ローカル/S3対応）
 */

import type { IStorage } from '@realworld-agent/shared';
import { config } from '../config';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class StorageService implements IStorage {
  private storageType: 's3' | 'r2' | 'local';
  private localStoragePath: string;

  constructor() {
    this.storageType = config.storage.provider;
    this.localStoragePath =
      config.storage.local?.path || path.join(process.cwd(), 'storage');

    // ローカルストレージディレクトリの作成
    if (this.storageType === 'local') {
      this.ensureLocalStorageDir();
    }
  }

  private async ensureLocalStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'photos'), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.localStoragePath, 'files'), {
        recursive: true,
      });
      logger.info('ローカルストレージディレクトリを作成しました', {
        path: this.localStoragePath,
      });
    } catch (error) {
      logger.error(
        'ローカルストレージディレクトリの作成に失敗しました',
        error as Error
      );
      throw error;
    }
  }

  getType(): string {
    return this.storageType;
  }

  async upload(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    if (this.storageType === 'local') {
      return this.uploadLocal(key, data, metadata);
    } else if (this.storageType === 's3' || this.storageType === 'r2') {
      return this.uploadS3(key, data, metadata);
    }

    throw new Error(`Unsupported storage type: ${this.storageType}`);
  }

  private async uploadLocal(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      const dirPath = path.dirname(filePath);

      // ディレクトリが存在しない場合は作成
      await fs.mkdir(dirPath, { recursive: true });

      // ファイルを保存
      await fs.writeFile(filePath, data);

      // メタデータを保存（オプション）
      if (metadata) {
        const metadataPath = `${filePath}.meta.json`;
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      logger.info('ファイルをローカルストレージに保存しました', {
        key,
        path: filePath,
        size: data.length,
      });

      return filePath;
    } catch (error) {
      logger.error('ローカルストレージへの保存に失敗しました', error as Error, {
        key,
      });
      throw error;
    }
  }

  private async uploadS3(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    // TODO: S3/R2への実装（S3 SDKが必要）
    logger.warn('S3/R2への保存は未実装です。ローカルにフォールバックします。', {
      key,
    });
    return this.uploadLocal(key, data, metadata);
  }

  async download(key: string): Promise<Buffer> {
    if (this.storageType === 'local') {
      return this.downloadLocal(key);
    } else if (this.storageType === 's3' || this.storageType === 'r2') {
      return this.downloadS3(key);
    }

    throw new Error(`Unsupported storage type: ${this.storageType}`);
  }

  private async downloadLocal(key: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      const data = await fs.readFile(filePath);

      logger.debug('ファイルをローカルストレージから読み込みました', {
        key,
        size: data.length,
      });

      return data;
    } catch (error) {
      logger.error('ローカルストレージからの読み込みに失敗しました', error as Error, {
        key,
      });
      throw error;
    }
  }

  private async downloadS3(key: string): Promise<Buffer> {
    // TODO: S3/R2からの実装
    logger.warn('S3/R2からの読み込みは未実装です。ローカルから読み込みます。', {
      key,
    });
    return this.downloadLocal(key);
  }

  async delete(key: string): Promise<void> {
    if (this.storageType === 'local') {
      return this.deleteLocal(key);
    } else if (this.storageType === 's3' || this.storageType === 'r2') {
      return this.deleteS3(key);
    }

    throw new Error(`Unsupported storage type: ${this.storageType}`);
  }

  private async deleteLocal(key: string): Promise<void> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      await fs.unlink(filePath);

      // メタデータも削除
      try {
        await fs.unlink(`${filePath}.meta.json`);
      } catch {
        // メタデータがない場合は無視
      }

      logger.info('ファイルをローカルストレージから削除しました', { key });
    } catch (error) {
      logger.error('ローカルストレージからの削除に失敗しました', error as Error, {
        key,
      });
      throw error;
    }
  }

  private async deleteS3(key: string): Promise<void> {
    // TODO: S3/R2からの削除実装
    logger.warn('S3/R2からの削除は未実装です。ローカルから削除します。', {
      key,
    });
    return this.deleteLocal(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.storageType === 'local') {
      return this.existsLocal(key);
    } else if (this.storageType === 's3' || this.storageType === 'r2') {
      return this.existsS3(key);
    }

    return false;
  }

  private async existsLocal(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.localStoragePath, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async existsS3(key: string): Promise<boolean> {
    // TODO: S3/R2の存在確認実装
    logger.warn('S3/R2の存在確認は未実装です。ローカルを確認します。', { key });
    return this.existsLocal(key);
  }

  async getUrl(key: string): Promise<string> {
    if (this.storageType === 'local') {
      // ローカルファイルパスを返す
      return path.join(this.localStoragePath, key);
    } else if (this.storageType === 's3' || this.storageType === 'r2') {
      // TODO: S3/R2の署名付きURLを返す
      logger.warn('S3/R2のURL取得は未実装です。ローカルパスを返します。', {
        key,
      });
      return path.join(this.localStoragePath, key);
    }

    throw new Error(`Unsupported storage type: ${this.storageType}`);
  }

  /**
   * 写真を保存（ヘルパーメソッド）
   */
  async savePhoto(
    sessionId: string,
    filename: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string }> {
    const key = `photos/${sessionId}/${filename}`;
    const url = await this.upload(key, data, metadata);

    logger.info('写真を保存しました', {
      sessionId,
      filename,
      key,
      size: data.length,
    });

    return { key, url };
  }

  /**
   * ファイルを保存（ヘルパーメソッド）
   */
  async saveFile(
    sessionId: string,
    filename: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string }> {
    const key = `files/${sessionId}/${filename}`;
    const url = await this.upload(key, data, metadata);

    logger.info('ファイルを保存しました', {
      sessionId,
      filename,
      key,
      size: data.length,
    });

    return { key, url };
  }
}

