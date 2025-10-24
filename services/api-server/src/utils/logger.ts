/**
 * Logger Utility
 * Winstonを使用した構造化ロギング + ファイル出力
 */

import winston from 'winston';
import type { ILogger } from '@realworld-agent/shared';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, json, printf, colorize } = winston.format;

// ログディレクトリの作成
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// カスタムフォーマット（開発環境用）
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// 詳細フォーマット（ファイル出力用）
const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
  });
});

// Winstonロガーの作成
const winstonLogger = winston.createLogger({
  level: config.logging.level,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: config.env === 'production' ? json() : combine(colorize(), devFormat),
    }),
    // 全ログファイル（常に出力）
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // エラーログファイル（常に出力）
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // アクセスログファイル
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// ILoggerインターフェースの実装
class Logger implements ILogger {
  debug(message: string, meta?: any): void {
    winstonLogger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    winstonLogger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    winstonLogger.warn(message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    winstonLogger.error(message, {
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
      ...meta,
    });
  }
}

export const logger = new Logger();

