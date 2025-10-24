/**
 * Importance Detector
 * 重要箇所の自動検出
 */

import type { IImportanceDetector, ImportantMoment } from '@realworld-agent/shared';

export class ImportanceDetector implements IImportanceDetector {
  // 重要キーワード
  private readonly keywords = [
    '重要',
    '問題',
    '決定',
    '仕様',
    '要件',
    'バグ',
    'エラー',
    '確認',
    'TODO',
    'FIXME',
    '修正',
    '実装',
    '設計',
    '変更',
    '追加',
    '削除',
    '必要',
    '緊急',
    '至急',
  ];

  // 固有表現のパターン（簡易版）
  private readonly entityPatterns = [
    /[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+/, // PascalCase (クラス名など)
    /[a-z]+_[a-z]+(?:_[a-z]+)*/, // snake_case (関数名など)
    /[a-z]+(?:[A-Z][a-z]+)+/, // camelCase (変数名など)
    /https?:\/\/[^\s]+/, // URL
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IPアドレス
  ];

  detectImportantMoments(text: string, timestamp: Date): ImportantMoment | null {
    const importance = this.calculateImportance(text);
    const threshold = parseFloat(process.env.IMPORTANCE_THRESHOLD || '0.7');

    if (importance < threshold) {
      return null;
    }

    const keywords = this.extractKeywords(text);
    const entities = this.extractEntities(text);

    return {
      timestamp,
      text,
      reason: this.determineReason(keywords, entities),
      importance,
      keywords,
      entities,
    };
  }

  calculateImportance(text: string): number {
    let score = 0;
    const normalizedText = text.toLowerCase();

    // キーワードマッチング
    const keywordMatches = this.keywords.filter((keyword) =>
      normalizedText.includes(keyword)
    );
    score += keywordMatches.length * 0.2;

    // 固有表現
    const entities = this.extractEntities(text);
    score += entities.length * 0.1;

    // 文の長さ（長すぎず短すぎない文が重要）
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 30) {
      score += 0.1;
    }

    // 疑問文（確認事項の可能性）
    if (text.includes('?') || text.includes('？')) {
      score += 0.2;
    }

    // スコアを0-1に正規化
    return Math.min(score, 1.0);
  }

  extractKeywords(text: string): string[] {
    const normalizedText = text.toLowerCase();
    return this.keywords.filter((keyword) => normalizedText.includes(keyword));
  }

  extractEntities(text: string): string[] {
    const entities: string[] = [];

    for (const pattern of this.entityPatterns) {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        entities.push(...matches);
      }
    }

    // 重複を削除
    return Array.from(new Set(entities));
  }

  /**
   * 理由を判定
   */
  private determineReason(keywords: string[], entities: string[]): string {
    if (keywords.includes('バグ') || keywords.includes('エラー')) {
      return 'バグ・エラー報告';
    }
    if (keywords.includes('仕様') || keywords.includes('要件')) {
      return '仕様・要件の言及';
    }
    if (keywords.includes('決定')) {
      return '重要な決定事項';
    }
    if (keywords.includes('TODO') || keywords.includes('FIXME')) {
      return 'タスク・TODO';
    }
    if (entities.length > 3) {
      return '技術的な詳細';
    }
    if (keywords.length > 2) {
      return `重要キーワード複数: ${keywords.slice(0, 2).join(', ')}`;
    }

    return '重要箇所検出';
  }
}

