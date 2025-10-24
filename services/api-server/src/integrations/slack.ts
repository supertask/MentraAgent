/**
 * Slack Integration
 * Slack通知の送信
 */

import type { ISlackIntegration, SlackNotification } from '@realworld-agent/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SlackIntegration implements ISlackIntegration {
  async sendMessage(notification: SlackNotification): Promise<void> {
    if (!config.external.slack) {
      logger.warn('Slack設定が見つかりません');
      return;
    }

    try {
      const response = await fetch(config.external.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: notification.channel,
          text: notification.text,
          attachments: notification.attachments,
          thread_ts: notification.threadTs,
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      logger.info('Slack通知を送信しました', { channel: notification.channel });
    } catch (error) {
      logger.error('Slack通知の送信に失敗しました', error as Error);
      throw error;
    }
  }

  async uploadFile(
    channel: string,
    file: Buffer,
    filename: string
  ): Promise<string> {
    if (!config.external.slack) {
      throw new Error('Slack設定が見つかりません');
    }

    try {
      const formData = new FormData();
      formData.append('file', new Blob([file]), filename);
      formData.append('channels', channel);

      const response = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.external.slack.botToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack file upload error: ${data.error}`);
      }

      logger.info('Slackにファイルをアップロードしました', { filename });
      return data.file.permalink;
    } catch (error) {
      logger.error('Slackファイルアップロードに失敗しました', error as Error);
      throw error;
    }
  }
}

