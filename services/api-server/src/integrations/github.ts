/**
 * GitHub Integration
 * GitHub PR作成とIssue管理
 */

import type { IGitHubIntegration, GitHubPullRequest } from '@realworld-agent/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class GitHubIntegration implements IGitHubIntegration {
  private readonly apiBase = 'https://api.github.com';

  async createPullRequest(pr: GitHubPullRequest): Promise<string> {
    if (!config.external.github) {
      throw new Error('GitHub設定が見つかりません');
    }

    try {
      // ブランチを作成
      const branchName = `feature/auto-generated-${Date.now()}`;
      await this.createBranch(branchName, pr.base);

      // ファイルをコミット
      for (const file of pr.files) {
        await this.createOrUpdateFile(branchName, file.path, file.content);
      }

      // PRを作成
      const prResponse = await this.githubRequest('/repos/:owner/:repo/pulls', {
        method: 'POST',
        body: JSON.stringify({
          title: pr.title,
          body: pr.body,
          head: branchName,
          base: pr.base,
        }),
      });

      logger.info('GitHub PRを作成しました', { number: prResponse.number });
      return prResponse.html_url;
    } catch (error) {
      logger.error('GitHub PR作成に失敗しました', error as Error);
      throw error;
    }
  }

  async createIssue(title: string, body: string): Promise<string> {
    if (!config.external.github) {
      throw new Error('GitHub設定が見つかりません');
    }

    try {
      const response = await this.githubRequest('/repos/:owner/:repo/issues', {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });

      logger.info('GitHub Issueを作成しました', { number: response.number });
      return response.html_url;
    } catch (error) {
      logger.error('GitHub Issue作成に失敗しました', error as Error);
      throw error;
    }
  }

  private async createBranch(branchName: string, baseBranch: string): Promise<void> {
    // ベースブランチのSHAを取得
    const baseRef = await this.githubRequest(
      `/repos/:owner/:repo/git/ref/heads/${baseBranch}`
    );

    // 新しいブランチを作成
    await this.githubRequest('/repos/:owner/:repo/git/refs', {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    });
  }

  private async createOrUpdateFile(
    branch: string,
    path: string,
    content: string
  ): Promise<void> {
    const encodedContent = Buffer.from(content).toString('base64');

    await this.githubRequest(`/repos/:owner/:repo/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Add/Update ${path}`,
        content: encodedContent,
        branch,
      }),
    });
  }

  private async githubRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = endpoint.replace(
      /:owner|:repo/g,
      (match) =>
        match === ':owner'
          ? config.external.github!.owner
          : config.external.github!.repo
    );

    const response = await fetch(`${this.apiBase}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.external.github!.token}`,
        Accept: 'application/vnd.github.v3+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    return response.json();
  }
}

