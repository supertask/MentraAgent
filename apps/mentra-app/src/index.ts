/**
 * MentraOS Application Entry Point
 * Mentra Glassからのリアルタイム入力を処理
 */

import { config } from 'dotenv';
import { RealWorldAgent } from './RealWorldAgent';

// 環境変数を読み込み
config();

// アプリケーション起動
const app = new RealWorldAgent();

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// グレースフルシャットダウン
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  await app.stop();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// アプリケーション開始
console.log('🚀 Starting Realworld Agent for MentraOS...');
await app.start();

