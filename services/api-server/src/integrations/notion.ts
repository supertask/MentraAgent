/**
 * Notion Integration
 * Notionページの作成と更新
 */

import type { INotionIntegration, NotionPage } from '@realworld-agent/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class NotionIntegration implements INotionIntegration {
  private readonly apiBase = 'https://api.notion.com/v1';
  private readonly apiVersion = '2022-06-28';

  async createPage(page: NotionPage): Promise<string> {
    if (!config.external.notion) {
      throw new Error('Notion設定が見つかりません');
    }

    try {
      const response = await this.notionRequest('/pages', {
        method: 'POST',
        body: JSON.stringify(page),
      });

      logger.info('Notionページを作成しました', { id: response.id });
      return response.url;
    } catch (error) {
      logger.error('Notionページ作成に失敗しました', error as Error);
      throw error;
    }
  }

  async updatePage(
    pageId: string,
    properties: Record<string, any>
  ): Promise<void> {
    if (!config.external.notion) {
      throw new Error('Notion設定が見つかりません');
    }

    try {
      await this.notionRequest(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      });

      logger.info('Notionページを更新しました', { pageId });
    } catch (error) {
      logger.error('Notionページ更新に失敗しました', error as Error);
      throw error;
    }
  }

  private async notionRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.external.notion!.apiKey}`,
        'Notion-Version': this.apiVersion,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${error}`);
    }

    return response.json();
  }
}

