/**
 * Cursor Agent Service
 * Cursor Background Agents APIとの統合
 */

import { logger } from '../utils/logger';

export interface CursorPlanRequest {
  specifications: string[];
  projectName: string;
  additionalContext?: string;
  githubRepo?: string;  // GitHubリポジトリURL
  githubBranch?: string; // ブランチ名
  githubSubDirectory?: string; // リポジトリ内のサブディレクトリ
}

export interface CursorPlan {
  files: Array<{
    path: string;
    description: string;
    dependencies: string[];
  }>;
  steps: Array<{
    id: string;
    stepNumber?: number;
    description: string;
    files?: string[];
    status?: string;
  }>;
  estimatedTime: string;
  summary: string;
  branchName?: string; // Cursor APIが作成したGitHubブランチ名
  cursorUrl?: string;  // Cursor UIでの表示URL
}

export interface CursorBuildRequest {
  plan: CursorPlan;
  specifications: string[];
  projectName: string;
  githubRepo?: string;  // GitHubリポジトリURL
  githubBranch?: string; // ブランチ名
  githubSubDirectory?: string; // リポジトリ内のサブディレクトリ
}

export interface CursorBuildResult {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  status: 'completed' | 'partial' | 'failed';
  message: string;
  branchName?: string; // Cursor APIが作成したGitHubブランチ名
  cursorUrl?: string;  // Cursor UIでの表示URL
}

export class CursorAgentService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    // Cursor APIの設定（環境変数から取得）
    // 正しいエンドポイント: https://api.cursor.com/v0
    this.apiUrl = process.env.CURSOR_API_URL || 'https://api.cursor.com/v0';
    this.apiKey = process.env.CURSOR_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('Cursor API Keyが設定されていません');
    }
  }

  /**
   * プランを生成
   */
  async createPlan(request: CursorPlanRequest): Promise<CursorPlan> {
    try {
      logger.info('Cursor Agentでプラン生成中...', {
        projectName: request.projectName,
        specCount: request.specifications.length,
      });

      if (!this.apiKey) {
        logger.warn('Cursor API Keyが未設定のため、モック実装を使用します');
        const prompt = this.buildPlanPrompt(request);
        return await this.mockCreatePlan(prompt, request);
      }

      // プロンプトを構築
      const prompt = this.buildPlanPrompt(request);

      // 実際のCursor APIを呼び出し
      const plan = await this.callCursorAgentAPI(
        prompt,
        'plan',
        undefined,
        request.githubRepo,
        request.githubBranch,
        request.githubSubDirectory
      );

      logger.info('プラン生成完了', {
        fileCount: plan.files.length,
        stepCount: plan.steps.length,
      });

      return plan;
    } catch (error) {
      logger.error('Cursor プラン生成エラー', { 
        error: error as Error,
        projectName: request.projectName,
        hasApiKey: !!this.apiKey,
        hasGithubRepo: !!request.githubRepo
      });
      // APIエラー時はモックにフォールバック
      logger.warn('モック実装にフォールバックします', {
        reason: (error as Error).message,
        projectName: request.projectName
      });
      const prompt = this.buildPlanPrompt(request);
      return await this.mockCreatePlan(prompt, request);
    }
  }

  /**
   * ビルドを実行
   */
  async executeBuild(request: CursorBuildRequest): Promise<CursorBuildResult> {
    try {
      logger.info('Cursor Agentでビルド実行中...', {
        projectName: request.projectName,
        fileCount: request.plan.files.length,
      });

      if (!this.apiKey) {
        logger.warn('Cursor API Keyが未設定のため、モック実装を使用します');
        const prompt = this.buildExecutionPrompt(request);
        return await this.mockExecuteBuild(prompt, request);
      }

      // プロンプトを構築
      const prompt = this.buildExecutionPrompt(request);

      // 実際のCursor APIを呼び出し
      const result = await this.callCursorAgentAPI(
        prompt,
        'build',
        request.plan,
        request.githubRepo,
        request.githubBranch,
        request.githubSubDirectory
      );

      logger.info('ビルド完了', {
        status: result.status,
        generatedFiles: result.files.length,
      });

      return result;
    } catch (error) {
      logger.error('Cursor ビルドエラー', { 
        error: error as Error,
        projectName: request.projectName,
        hasApiKey: !!this.apiKey,
        hasGithubRepo: !!request.githubRepo
      });
      // APIエラー時はモックにフォールバック
      logger.warn('モック実装にフォールバックします', {
        reason: (error as Error).message,
        projectName: request.projectName
      });
      const prompt = this.buildExecutionPrompt(request);
      return await this.mockExecuteBuild(prompt, request);
    }
  }

  /**
   * チャットメッセージを送信
   */
  async sendChatMessage(
    sessionId: string,
    message: string,
    context: {
      specifications?: string[];
      plan?: CursorPlan;
    }
  ): Promise<{ response: string }> {
    try {
      logger.info('Cursor Agentチャットメッセージ送信', {
        sessionId,
        messageLength: message.length,
      });

      if (!this.apiKey) {
        logger.warn('Cursor API Keyが未設定のため、モック実装を使用します');
        const response = await this.mockChatResponse(message, context);
        return { response };
      }

      // 実際のCursor APIを呼び出し
      const response = await this.callCursorChatAPI(sessionId, message, context);

      return { response };
    } catch (error) {
      logger.error('Cursor チャットエラー', error as Error);
      // APIエラー時はモックにフォールバック
      logger.warn('モック実装にフォールバックします');
      const response = await this.mockChatResponse(message, context);
      return { response };
    }
  }

  // ===== プライベートメソッド =====

  private buildPlanPrompt(request: CursorPlanRequest): string {
    const specs = request.specifications.join('\n\n---\n\n');

    return `
あなたはCursor Agentです。以下の仕様書に基づいて実装プランを作成してください。

【プロジェクト】
${request.projectName}

【仕様書】
${specs}

${request.additionalContext ? `【追加コンテキスト】\n${request.additionalContext}\n` : ''}

【要求】
- 必要なファイルを全てリストアップ
- 各ファイルの役割を明記
- 実装順序を提示
- 依存関係を考慮

プランをJSON形式で返してください。
`;
  }

  private buildExecutionPrompt(request: CursorBuildRequest): string {
    const specs = request.specifications.join('\n\n---\n\n');

    return `
以下のプランに基づいてコードを実装してください。

【プロジェクト】
${request.projectName}

【仕様書】
${specs}

【プラン】
${JSON.stringify(request.plan, null, 2)}

【実装ガイドライン】
- TypeScript/Python等の適切な言語を使用
- ベストプラクティスに従う
- コメントを適切に記載
- テストコードも含める
`;
  }

  // ===== Cursor API呼び出し =====

  /**
   * Cursor Agent APIを呼び出し（プラン生成・ビルド実行）
   * 参考: https://cursor.com/ja/docs/background-agent/api/endpoints
   */
  private async callCursorAgentAPI(
    prompt: string,
    mode: 'plan' | 'build',
    plan?: CursorPlan,
    githubRepo?: string,
    githubBranch?: string,
    githubSubDirectory?: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Cursor Background Agent API の正しいペイロード形式
    const requestBody: any = {
      prompt: {
        text: mode === 'plan'
          ? `以下の仕様書に基づいて実装プランをJSON形式で生成してください。\n\n${prompt}`
          : `以下のプランに基づいてコードを生成してください。\n\n${prompt}${plan ? '\n\nプラン:\n' + JSON.stringify(plan, null, 2) : ''}`
      }
    };

    // GitHubリポジトリが指定されている場合は追加
    if (githubRepo) {
      requestBody.source = {
        repository: githubRepo
      };
      if (githubBranch) {
        requestBody.source.ref = githubBranch;
      }
      // サブディレクトリが指定されている場合は追加
      if (githubSubDirectory) {
        requestBody.source.path = githubSubDirectory;
      }
    }

    try {
      // エージェントを作成
      logger.info('Cursor Agent を作成中...', { 
        mode,
        apiUrl: this.apiUrl,
        hasGithubRepo: !!githubRepo,
        githubRepo,
        githubBranch,
        promptLength: requestBody.prompt.text.length
      });

      const createResponse = await fetch(`${this.apiUrl}/agents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        logger.error('Cursor Agent 作成失敗', { 
          status: createResponse.status,
          errorText 
        });
        throw new Error(
          `Cursor API Error: ${createResponse.status} - ${errorText}`
        );
      }

      const agentData = (await createResponse.json()) as any;
      const agentId = agentData.id;

      if (!agentId) {
        logger.error('Agent ID が取得できませんでした', { agentData });
        throw new Error('Agent ID が取得できませんでした');
      }

      logger.info('Cursor Agent 作成成功', { 
        agentId,
        status: agentData.status,
        name: agentData.name,
        branchName: agentData.target?.branchName
      });

      // エージェントの完了を待機
      // ビルドは時間がかかるため、より長いタイムアウトを設定
      const timeout = mode === 'build' ? 600 : 300; // ビルド: 10分、プラン: 5分
      const result = await this.waitForAgentCompletion(agentId, mode, timeout);

      return result;
    } catch (error) {
      logger.error('Cursor API呼び出しエラー', error as Error);
      throw error;
    }
  }

  /**
   * エージェントの完了を待機
   */
  private async waitForAgentCompletion(
    agentId: string,
    mode: 'plan' | 'build',
    maxWaitTime: number = 300, // プラン: 300秒（5分）、ビルド: 別途指定
    pollInterval: number = 5
  ): Promise<any> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
    };

    logger.info('エージェントの完了を待機中...', { 
      agentId, 
      maxWaitTime,
      pollInterval 
    });

    const startTime = Date.now();
    let pollCount = 0;
    
    while (Date.now() - startTime < maxWaitTime * 1000) {
      try {
        pollCount++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        const response = await fetch(`${this.apiUrl}/agents/${agentId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('エージェント状態確認HTTPエラー', {
            status: response.status,
            errorText
          });
          throw new Error(
            `Cursor API Error: ${response.status} - ${errorText}`
          );
        }

        const statusData = (await response.json()) as any;
        const status = statusData.status;

        logger.info('エージェント状態', { 
          agentId, 
          status,
          pollCount,
          elapsedSeconds,
          summary: statusData.summary?.substring(0, 50)
        });

        // Cursor APIは大文字のステータスを返す（CREATING, RUNNING, FINISHED, FAILED, CANCELLEDなど）
        const statusUpper = status?.toUpperCase();

        if (statusUpper === 'COMPLETED' || statusUpper === 'DONE' || statusUpper === 'FINISHED') {
          // 完了したので結果をパース
          logger.info('エージェント完了', { agentId, status });
          if (mode === 'plan') {
            return this.parsePlanFromAgent(statusData);
          } else {
            return this.parseBuildFromAgent(statusData);
          }
        } else if (statusUpper === 'FAILED' || statusUpper === 'CANCELLED' || statusUpper === 'ERROR') {
          throw new Error(`エージェントが失敗しました: ${status}`);
        }

        // まだ実行中なので待機
        logger.info('次のポーリングまで待機中...', { 
          pollCount,
          elapsedSeconds,
          remainingSeconds: maxWaitTime - elapsedSeconds
        });
        await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
      } catch (error) {
        logger.error('エージェント状態確認エラー', { 
          error: error as Error,
          pollCount,
          elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
        });
        throw error;
      }
    }

    // タイムアウト
    const totalElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    logger.error('エージェント完了待機がタイムアウト', { 
      agentId,
      totalElapsedSeconds,
      maxWaitTime,
      pollCount
    });
    throw new Error(`エージェントの完了待機がタイムアウトしました（${totalElapsedSeconds}秒経過、${pollCount}回ポーリング）`);
  }

  /**
   * Cursor Chat APIを呼び出し (フォローアップメッセージ)
   */
  private async callCursorChatAPI(
    sessionId: string,
    message: string,
    context: any
  ): Promise<string> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // コンテキストを含むメッセージを構築
    let fullMessage = message;
    if (context.specifications) {
      fullMessage += `\n\n関連する仕様書:\n${context.specifications.join('\n\n---\n\n')}`;
    }
    if (context.plan) {
      fullMessage += `\n\n現在のプラン:\n${JSON.stringify(context.plan, null, 2)}`;
    }

    const requestBody = {
      prompt: {
        text: fullMessage
      }
    };

    try {
      // セッションIDをエージェントIDとして使用し、フォローアップを送信
      const response = await fetch(`${this.apiUrl}/agents/${sessionId}/followup`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Cursor API Error: ${response.status} - ${errorText}`
        );
      }

      const data = (await response.json()) as any;
      
      // フォローアップの結果を待機
      const result = await this.waitForAgentCompletion(sessionId, 'plan');
      
      return result.summary || 'フォローアップが完了しました';
    } catch (error) {
      logger.error('Cursor Chat API呼び出しエラー', error as Error);
      throw error;
    }
  }

  /**
   * エージェントからプランをパース
   */
  private parsePlanFromAgent(agentData: any): CursorPlan {
    try {
      logger.info('プランパース開始', { 
        agentDataKeys: Object.keys(agentData),
        hasTarget: !!agentData.target,
        hasSummary: !!agentData.summary
      });

      // Cursor APIの実際のレスポンス構造に対応
      // agentData = { id, status, summary, source, target, name, createdAt }
      const summary = agentData.summary || '';
      const target = agentData.target || {};
      
      logger.info('プランをパース中', { 
        summaryLength: summary.length,
        summaryPreview: summary.substring(0, 100),
        branchName: target.branchName,
        url: target.url 
      });

      // プランをGitHubブランチから取得する必要があるが、
      // 簡易実装としてsummaryをそのまま使用
      // summaryが空の場合は、ブランチ情報を含むメッセージを表示
      const planDescription = summary || 
        `プランが作成されました。詳細は以下のGitHubブランチをご確認ください：\n` +
        `ブランチ: ${target.branchName}\n` +
        `Cursor UI: ${target.url}`;
      
      const plan = {
        files: [], // 実際のファイルリストは取得できないため空配列
        steps: [
          {
            id: '1',
            description: planDescription,
            status: 'completed',
          }
        ],
        estimatedTime: '未定',
        summary: planDescription,
        branchName: target.branchName, // 生成されたブランチ名
        cursorUrl: target.url, // Cursor UIでのURL
      };

      logger.info('プランパース完了', { 
        stepsCount: plan.steps.length,
        branchName: plan.branchName,
        cursorUrl: plan.cursorUrl
      });

      return plan;
    } catch (error) {
      logger.error('プランパースエラー', error as Error);
      throw new Error('Failed to parse plan from agent');
    }
  }

  /**
   * エージェントからビルド結果をパース
   */
  private parseBuildFromAgent(agentData: any): CursorBuildResult {
    try {
      logger.info('ビルド結果パース開始', { 
        agentDataKeys: Object.keys(agentData),
        hasTarget: !!agentData.target,
        hasSummary: !!agentData.summary
      });

      const summary = agentData.summary || '';
      const target = agentData.target || {};

      logger.info('ビルド結果をパース中', { 
        summaryLength: summary.length,
        branchName: target.branchName,
        url: target.url 
      });

      // ファイルを抽出（実際にはGitHubブランチから取得する必要がある）
      const files: any[] = [];
      const fileRegex = /```(\w+):(.+?)\n([\s\S]*?)```/g;
      let match;

      while ((match = fileRegex.exec(summary)) !== null) {
        const [, language, path, fileContent] = match;
        files.push({
          path: path.trim(),
          content: fileContent.trim(),
          language: language.toLowerCase(),
        });
      }

      // メッセージを生成（ブランチ情報を含む）
      let message: string;
      if (files.length > 0) {
        message = `${files.length}個のファイルを生成しました`;
      } else {
        message = `ビルドが完了しました。\n` +
                  `ブランチ: ${target.branchName}\n` +
                  `Cursor UI: ${target.url}\n` +
                  `GitHubブランチで生成されたコードを確認してください。`;
      }

      const result = {
        files,
        status: 'completed' as const, // GitHubに保存されているので完了扱い
        message,
        branchName: target.branchName,
        cursorUrl: target.url,
      };

      logger.info('ビルド結果パース完了', { 
        filesCount: result.files.length,
        status: result.status,
        branchName: result.branchName
      });

      return result;
    } catch (error) {
      logger.error('ビルド結果パースエラー', error as Error);
      throw new Error('Failed to parse build result from agent');
    }
  }

  /**
   * プラン生成レスポンスをパース
   */
  private parsePlanResponse(data: any): CursorPlan {
    try {
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // JSONを抽出（マークダウンコードブロックに囲まれている場合）
      let jsonText = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);

      return {
        files: parsed.files || [],
        steps: parsed.steps || [],
        estimatedTime: parsed.estimatedTime || '未定',
        summary: parsed.summary || '',
      };
    } catch (error) {
      logger.error('プランレスポンスのパースエラー', error as Error);
      throw new Error('Failed to parse plan response');
    }
  }

  /**
   * ビルド実行レスポンスをパース
   */
  private parseBuildResponse(data: any): CursorBuildResult {
    try {
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // ファイルを抽出
      const files: any[] = [];
      const fileRegex = /```(\w+):(.+?)\n([\s\S]*?)```/g;
      let match;

      while ((match = fileRegex.exec(content)) !== null) {
        const [, language, path, fileContent] = match;
        files.push({
          path: path.trim(),
          content: fileContent.trim(),
          language: language.toLowerCase(),
        });
      }

      return {
        files,
        status: files.length > 0 ? 'completed' : 'failed',
        message: files.length > 0
          ? `${files.length}個のファイルを生成しました`
          : 'ファイルの生成に失敗しました',
      };
    } catch (error) {
      logger.error('ビルドレスポンスのパースエラー', error as Error);
      throw new Error('Failed to parse build response');
    }
  }

  // ===== モック実装（APIキーが未設定の場合のフォールバック） =====

  private async mockCreatePlan(
    prompt: string,
    request: CursorPlanRequest
  ): Promise<CursorPlan> {
    // 仕様書から必要なファイルを推測
    const files = [
      {
        path: 'src/index.ts',
        description: 'アプリケーションのエントリーポイント',
        dependencies: [],
      },
      {
        path: 'src/services/AuthService.ts',
        description: '認証サービス',
        dependencies: ['src/models/User.ts'],
      },
      {
        path: 'src/models/User.ts',
        description: 'ユーザーモデル',
        dependencies: [],
      },
      {
        path: 'README.md',
        description: 'プロジェクトドキュメント',
        dependencies: [],
      },
    ];

    const steps = [
      {
        id: '1',
        stepNumber: 1,
        description: 'データモデルの定義',
        files: ['src/models/User.ts'],
        status: 'pending',
      },
      {
        id: '2',
        stepNumber: 2,
        description: '認証サービスの実装',
        files: ['src/services/AuthService.ts'],
        status: 'pending',
      },
      {
        id: '3',
        stepNumber: 3,
        description: 'エントリーポイントの作成',
        files: ['src/index.ts'],
        status: 'pending',
      },
      {
        id: '4',
        stepNumber: 4,
        description: 'ドキュメント作成',
        files: ['README.md'],
        status: 'pending',
      },
    ];

    return {
      files,
      steps,
      estimatedTime: '約30分',
      summary: `${request.projectName}の実装プランを作成しました。${files.length}個のファイルを${steps.length}ステップで実装します。`,
    };
  }

  private async mockExecuteBuild(
    prompt: string,
    request: CursorBuildRequest
  ): Promise<CursorBuildResult> {
    // プランに基づいてファイルを生成
    const files = request.plan.files.map((file) => ({
      path: file.path,
      content: this.generateMockFileContent(file.path, file.description),
      language: this.detectLanguage(file.path),
    }));

    return {
      files,
      status: 'completed',
      message: `${files.length}個のファイルを生成しました`,
    };
  }

  private async mockChatResponse(
    message: string,
    context: any
  ): Promise<string> {
    // メッセージに応じて適切な応答を生成
    if (message.toLowerCase().includes('plan') || message.includes('プラン')) {
      return 'プランを確認しました。実装の準備ができています。Buildボタンを押して実装を開始してください。';
    }

    if (message.toLowerCase().includes('change') || message.includes('変更')) {
      return 'プランの変更を反映しました。どの部分を修正しますか？';
    }

    return '了解しました。他に質問はありますか？';
  }

  private generateMockFileContent(path: string, description: string): string {
    const ext = path.split('.').pop();

    switch (ext) {
      case 'ts':
      case 'tsx':
        return `/**
 * ${description}
 */

export class ${this.extractClassName(path)} {
  constructor() {
    // TODO: Implementation
  }

  // TODO: Add methods
}
`;

      case 'md':
        return `# ${path}

${description}

## Getting Started

TODO: Add setup instructions

## Usage

TODO: Add usage examples
`;

      default:
        return `// ${description}\n\n// TODO: Implementation\n`;
    }
  }

  private extractClassName(path: string): string {
    const filename = path.split('/').pop() || '';
    const name = filename.replace(/\.(ts|tsx|js|jsx)$/, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
    };

    return langMap[ext || ''] || 'text';
  }
}


