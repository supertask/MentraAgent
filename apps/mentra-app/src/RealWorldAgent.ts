/**
 * Realworld Agent Main Application
 * MentraOSのAppServerを拡張したメインアプリケーション
 */

import { AppServer, AppSession } from '@mentra/sdk';
import type {
  TranscriptionData,
  PhotoData,
  ImportantMoment,
  ContextData,
} from '@realworld-agent/shared';
import { ContextManager } from './services/ContextManager';
import { ImportanceDetector } from './services/ImportanceDetector';
import { APIServerClient } from './services/APIServerClient';

export class RealWorldAgent extends AppServer {
  private contextManager: ContextManager;
  private importanceDetector: ImportanceDetector;
  private apiClient: APIServerClient;
  private lastCaptureTime: Date | null = null;
  private readonly captureCooldownMs = 30000; // 30秒

  constructor() {
    super();
    this.contextManager = new ContextManager();
    this.importanceDetector = new ImportanceDetector();
    this.apiClient = new APIServerClient();
  }

  async start(): Promise<void> {
    console.log('🎯 Realworld Agent Starting...');
    console.log(`📦 Package: ${process.env.MENTRAOS_PACKAGE_NAME}`);
    console.log(`🔑 API Key: ${process.env.MENTRAOS_API_KEY ? '***' : 'Not Set'}`);
  }

  async stop(): Promise<void> {
    console.log('👋 Realworld Agent Stopping...');
  }

  /**
   * セッション開始時の処理
   * MentraOS SDKから呼び出される
   */
  protected async onSession(
    session: AppSession,
    sessionId: string,
    userId: string
  ): Promise<void> {
    session.logger.info('🎬 セッション開始', { sessionId, userId });

    // APIサーバーにセッション登録
    await this.apiClient.createSession({
      sessionId,
      userId,
      deviceType: 'mentra',
    });

    // 接続イベント
    session.events.onConnected((settings) => {
      session.logger.info('✅ MentraOSに接続しました', settings);
      session.audio.speak('リアルワールドエージェントを起動しました');
    });

    // 切断イベント
    session.events.onDisconnected((reason) => {
      session.logger.info('⚠️ MentraOSから切断されました', { reason });
      this.handleSessionEnd(sessionId);
    });

    // エラーイベント
    session.events.onError((error) => {
      session.logger.error('❌ エラー発生', error);
    });

    // メイン処理
    await this.runMainLogic(session, sessionId, userId);
  }

  /**
   * メインロジック
   */
  private async runMainLogic(
    session: AppSession,
    sessionId: string,
    userId: string
  ): Promise<void> {
    // デバイス機能の確認
    const capabilities = session.capabilities;
    if (capabilities) {
      session.logger.info('📱 デバイス機能', capabilities);

      if (!capabilities.hasCamera || !capabilities.hasMicrophone) {
        session.logger.warn('⚠️ カメラまたはマイクが利用できません');
        await session.audio.speak(
          '一部の機能が利用できません。カメラとマイクを確認してください。'
        );
      }
    }

    // 1. リアルタイム文字起こし
    session.events.onTranscription(async (data) => {
      await this.handleTranscription(session, sessionId, data);
    });

    // 2. 音声活動検出
    session.events.onVoiceActivity((data) => {
      if (data.status === true || data.status === 'true') {
        session.logger.debug('🎤 話し始め検出');
      } else {
        session.logger.debug('🎤 話し終わり検出');
      }
    });

    // 3. ボタン押下
    session.events.onButtonPress(async (data) => {
      if (data.pressType === 'short') {
        session.logger.info('📸 ボタン押下: 写真撮影');
        await this.capturePhoto(session, sessionId, '手動撮影');
      } else if (data.pressType === 'long') {
        session.logger.info('📄 ボタン長押し: 仕様書生成');
        await this.generateSpecification(session, sessionId);
      }
    });

    // 4. 位置情報（オプション）
    session.events.onLocation((data) => {
      this.contextManager.addLocation({
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy || 0,
        timestamp: data.timestamp,
      });
    });

    // 5. バッテリー監視
    session.events.onGlassesBattery((data) => {
      if (data.level < 20) {
        session.logger.warn(`🔋 バッテリー低下: ${data.level}%`);
        session.audio.speak('バッテリーが少なくなっています');
      }
    });

    session.logger.info('✅ すべてのイベントリスナーを設定しました');
  }

  /**
   * 文字起こし処理
   */
  private async handleTranscription(
    session: AppSession,
    sessionId: string,
    data: TranscriptionData
  ): Promise<void> {
    if (!data.isFinal) {
      // 中間結果はデバッグログのみ
      session.logger.debug(`💭 認識中: ${data.text}`);
      return;
    }

    // 確定した文字起こし
    session.logger.info(`✍️ 文字起こし: ${data.text}`);

    // コンテキストに追加
    this.contextManager.addTranscription({
      text: data.text,
      timestamp: data.timestamp,
    });

    // APIサーバーに送信
    await this.apiClient.sendTranscription(sessionId, data);

    // コード生成の意図を検出
    const codeIntent = this.importanceDetector.detectCodeGenerationIntent(data.text);
    if (codeIntent.shouldGenerate) {
      session.logger.info(
        `💻 コード生成リクエスト検出 (信頼度: ${codeIntent.confidence.toFixed(2)})`
      );
      await this.handleCodeGeneration(session, sessionId, codeIntent.extractedPrompt);
      return; // コード生成を実行した場合は重要箇所検出をスキップ
    }

    // 重要箇所検出
    const importantMoment = this.importanceDetector.detectImportantMoments(
      data.text,
      data.timestamp
    );

    if (importantMoment) {
      session.logger.info(`⭐ 重要箇所検出: ${importantMoment.reason}`);
      await this.handleImportantMoment(session, sessionId, importantMoment);
    }
  }

  /**
   * 重要箇所の処理
   */
  private async handleImportantMoment(
    session: AppSession,
    sessionId: string,
    moment: ImportantMoment
  ): Promise<void> {
    // APIサーバーに通知
    await this.apiClient.sendImportantMoment(sessionId, moment);

    // 音声フィードバック
    if (moment.importance > 0.8) {
      await session.audio.speak('重要な情報を検出しました');
    }

    // 自動撮影
    const autoCapture = process.env.AUTO_CAPTURE_ENABLED !== 'false';
    if (autoCapture && this.shouldCapture()) {
      session.logger.info('📸 重要箇所で自動撮影');
      await this.capturePhoto(session, sessionId, moment.reason);
      this.lastCaptureTime = new Date();
    }
  }

  /**
   * 写真撮影
   */
  private async capturePhoto(
    session: AppSession,
    sessionId: string,
    reason: string
  ): Promise<void> {
    try {
      const photo = await session.camera.requestPhoto({
        size: 'medium',
        saveToGallery: true,
      });

      session.logger.info(`📸 写真撮影完了: ${photo.filename}`);

      // コンテキストに追加
      this.contextManager.addPhoto({
        photo,
        timestamp: photo.timestamp,
        relatedText: reason,
      });

      // APIサーバーに送信
      await this.apiClient.sendPhoto(sessionId, photo, reason);

      await session.audio.speak('写真を保存しました');
    } catch (error) {
      session.logger.error('📸 写真撮影エラー', error as Error);
      await session.audio.speak('写真の撮影に失敗しました');
    }
  }

  /**
   * 仕様書生成
   */
  private async generateSpecification(
    session: AppSession,
    sessionId: string
  ): Promise<void> {
    try {
      session.logger.info('📄 仕様書生成を開始');
      await session.audio.speak('仕様書を生成しています');

      // コンテキストを取得
      const context = this.contextManager.getContext(300000); // 直近5分

      // APIサーバーに依頼
      const result = await this.apiClient.generateSpecification(
        sessionId,
        context
      );

      session.logger.info(`✅ 仕様書生成完了: ${result.title}`);
      await session.audio.speak('仕様書を生成しました');
    } catch (error) {
      session.logger.error('📄 仕様書生成エラー', error as Error);
      await session.audio.speak('仕様書の生成に失敗しました');
    }
  }

  /**
   * コード生成
   */
  private async handleCodeGeneration(
    session: AppSession,
    sessionId: string,
    prompt: string
  ): Promise<void> {
    try {
      session.logger.info('💻 コード生成を開始');
      await session.audio.speak('コードを生成しています');

      // 言語・フレームワークの抽出（簡易版）
      const language = this.extractLanguage(prompt);
      const framework = this.extractFramework(prompt);

      session.logger.info('コード生成リクエスト', {
        prompt: prompt.substring(0, 100),
        language,
        framework,
      });

      // APIサーバーに依頼
      const result = await this.apiClient.generateCode({
        sessionId,
        prompt,
        language,
        framework,
      });

      session.logger.info(`✅ コード生成完了: ${result.files.length}ファイル`);

      // 生成されたファイルをログに出力
      for (const file of result.files) {
        session.logger.info(`  📄 ${file.path} (${file.language})`);
      }

      await session.audio.speak(
        `コードを生成しました。${result.files.length}個のファイルを作成しました`
      );
    } catch (error) {
      session.logger.error('💻 コード生成エラー', error as Error);
      await session.audio.speak('コードの生成に失敗しました');
    }
  }

  /**
   * プロンプトから言語を抽出
   */
  private extractLanguage(text: string): string | undefined {
    const normalizedText = text.toLowerCase();
    const languageMap: { [key: string]: string } = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      java: 'java',
      go: 'go',
      rust: 'rust',
      ruby: 'ruby',
      php: 'php',
      csharp: 'csharp',
      'c#': 'csharp',
      cpp: 'cpp',
      'c\\+\\+': 'cpp',
    };

    for (const [pattern, language] of Object.entries(languageMap)) {
      if (new RegExp(pattern, 'i').test(normalizedText)) {
        return language;
      }
    }

    return undefined;
  }

  /**
   * プロンプトからフレームワークを抽出
   */
  private extractFramework(text: string): string | undefined {
    const normalizedText = text.toLowerCase();
    const frameworkMap: { [key: string]: string } = {
      react: 'react',
      vue: 'vue',
      angular: 'angular',
      'next\\.?js': 'nextjs',
      'node\\.?js': 'nodejs',
      express: 'express',
      fastapi: 'fastapi',
      django: 'django',
      flask: 'flask',
      rails: 'rails',
      laravel: 'laravel',
      spring: 'spring',
    };

    for (const [pattern, framework] of Object.entries(frameworkMap)) {
      if (new RegExp(pattern, 'i').test(normalizedText)) {
        return framework;
      }
    }

    return undefined;
  }

  /**
   * 撮影可能かチェック（クールダウン）
   */
  private shouldCapture(): boolean {
    if (!this.lastCaptureTime) {
      return true;
    }

    const elapsed = Date.now() - this.lastCaptureTime.getTime();
    return elapsed >= this.captureCooldownMs;
  }

  /**
   * セッション終了処理
   */
  private async handleSessionEnd(sessionId: string): Promise<void> {
    console.log(`🏁 セッション終了: ${sessionId}`);

    // APIサーバーに通知
    await this.apiClient.endSession(sessionId);

    // コンテキストをクリア
    this.contextManager.clear();
    this.lastCaptureTime = null;
  }
}

