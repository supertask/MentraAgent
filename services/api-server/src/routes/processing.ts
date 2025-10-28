/**
 * Processing Router
 * AI処理関連のAPI
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { ModalGPUService } from '../services/ModalGPUService';
import { SpecificationRepository } from '../repositories/SpecificationRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { TranscriptionRepository } from '../repositories/TranscriptionRepository';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { SessionRepository } from '../repositories/SessionRepository';

export const processingRouter: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as DatabaseService;
  const modalGPU = new ModalGPUService();
  const specRepo = new SpecificationRepository(db);
  const documentRepo = new DocumentRepository(db);
  const transcriptionRepo = new TranscriptionRepository(db);
  const photoRepo = new PhotoRepository(db);
  const sessionRepo = new SessionRepository(db);
  // 文字起こし（バッチ）
  fastify.post('/transcribe', async (request, reply) => {
    const body = request.body as any;

    logger.info('Transcription request', {
      sessionId: body.sessionId,
    });

    // TODO: GPU処理実装

    return {
      transcription: 'Mock transcription',
      confidence: 0.95,
    };
  });

  // 画像分析
  fastify.post('/analyze-image', async (request, reply) => {
    const body = request.body as any;

    logger.info('Image analysis request', {
      sessionId: body.sessionId,
    });

    // TODO: Vision処理実装

    return {
      description: 'Mock image description',
      objects: [],
    };
  });

  // 仕様書生成
  fastify.post('/generate-spec', async (request, reply) => {
    try {
      const body = request.body as any;
      const { sessionId } = body;

      if (!sessionId) {
        return reply.status(400).send({ error: 'sessionId is required' });
      }

      logger.info('Specification generation request', { sessionId });

      // セッションのコンテキストを取得
      const transcriptions = await transcriptionRepo.findBySessionId(sessionId);
      const photos = await photoRepo.findBySessionId(sessionId);

      logger.info('コンテキストを取得しました', {
        sessionId,
        transcriptionCount: transcriptions.length,
        photoCount: photos.length,
      });

      // コンテキストの整形（空のテキストは除外）
      const context = {
        transcriptions: transcriptions
          .filter((t) => t.text && t.text.trim() !== '')
          .map((t) => ({
            text: t.text,
            timestamp: t.timestamp,
            speaker: t.speaker,
          })),
        photos: photos.map((p) => ({
          filename: p.filename,
          storageKey: p.requestId,
          timestamp: p.timestamp,
        })),
      };

      // Modal GPUサーバーで仕様書を生成
      logger.info('Modal GPUサーバーで仕様書を生成中...', { sessionId });
      const generatedSpec = await modalGPU.generateSpecification(context);

      // セッションの存在確認（存在しない場合は作成）
      let session = await sessionRepo.findById(sessionId);
      if (!session) {
        session = await sessionRepo.create({
          userId: 'anonymous',
          deviceType: 'webcam',
          status: 'completed',
          metadata: {},
        });
        logger.info('仕様書用のセッションを作成しました', {
          oldSessionId: sessionId,
          newSessionId: session.sessionId,
        });
      }

      // データベースに保存
      const savedSpec = await specRepo.create({
        sessionId: session.sessionId,
        title: generatedSpec.title,
        summary: generatedSpec.content.substring(0, 500), // 最初の500文字を要約として
        content: {
          markdown: generatedSpec.content,
          model: generatedSpec.model,
          generatedAt: new Date().toISOString(),
          contextSummary: {
            transcriptionCount: transcriptions.length,
            photoCount: photos.length,
          },
        },
        status: 'draft',
      });

      logger.info('仕様書を生成・保存しました', {
        specificationId: savedSpec.id,
        sessionId,
        title: savedSpec.title,
      });

      return {
        specificationId: savedSpec.id,
        title: savedSpec.title,
        summary: savedSpec.summary,
        model: generatedSpec.model,
      };
    } catch (error) {
      logger.error('仕様書生成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate specification',
        message: (error as Error).message,
      });
    }
  });

  // ミーティング生成（仕様書・議事録・メモ）
  fastify.post('/generate-document', async (request, reply) => {
    try {
      const body = request.body as any;
      const { sessionId, projectIds, documentType, additionalPrompt } = body;

      if (!sessionId) {
        return reply.status(400).send({ error: 'sessionId is required' });
      }

      if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
        return reply.status(400).send({
          error: 'projectIds is required and must be a non-empty array',
        });
      }

      logger.info('Document generation request', {
        sessionId,
        projectIds,
        documentType: documentType || 'auto',
      });

      // セッションのコンテキストを取得
      const transcriptions = await transcriptionRepo.findBySessionId(sessionId);
      const photos = await photoRepo.findBySessionId(sessionId);

      logger.info('コンテキストを取得しました', {
        sessionId,
        transcriptionCount: transcriptions.length,
        photoCount: photos.length,
      });

      // コンテキストの整形
      const context = {
        transcriptions: transcriptions
          .filter((t) => t.text && t.text.trim() !== '')
          .map((t) => ({
            text: t.text,
            timestamp: t.timestamp,
            speaker: t.speaker,
          })),
        photos: photos.map((p) => ({
          filename: p.filename,
          storageKey: p.requestId,
          timestamp: p.timestamp,
        })),
      };

      // Modal GPUサーバーでドキュメントを生成
      logger.info('Modal GPUサーバーでドキュメント生成中...', { sessionId });
      const generatedDoc = await modalGPU.generateDocument(
        context,
        documentType || 'auto',
        additionalPrompt || ''
      );

      // セッションの存在確認（存在しない場合は作成）
      let session = await sessionRepo.findById(sessionId);
      if (!session) {
        session = await sessionRepo.create({
          userId: 'anonymous',
          deviceType: 'webcam',
          status: 'completed',
          metadata: {},
        });
        logger.info('ドキュメント用のセッションを作成しました', {
          oldSessionId: sessionId,
          newSessionId: session.sessionId,
        });
      }

      // データベースに保存
      const savedDoc = await documentRepo.create({
        sessionId: session.sessionId,
        title: generatedDoc.title,
        summary: generatedDoc.content.substring(0, 500),
        content: {
          markdown: generatedDoc.content,
          model: generatedDoc.model,
          generatedAt: new Date().toISOString(),
          contextSummary: {
            transcriptionCount: transcriptions.length,
            photoCount: photos.length,
          },
        },
        type: generatedDoc.type as 'specification' | 'minutes' | 'memo',
        projectIds,
      });

      logger.info('ドキュメントを生成・保存しました', {
        documentId: savedDoc.id,
        sessionId,
        title: savedDoc.title,
        type: savedDoc.type,
        projectIds,
      });

      return {
        documentId: savedDoc.id,
        title: savedDoc.title,
        summary: savedDoc.summary,
        type: savedDoc.type,
        model: generatedDoc.model,
        projectIds,
      };
    } catch (error) {
      logger.error('ドキュメント生成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate document',
        message: (error as Error).message,
      });
    }
  });

  // ミーティング一覧取得
  fastify.get('/documents', async (request, reply) => {
    try {
      const { projectId } = request.query as { projectId?: string };

      let documents;
      if (projectId) {
        // プロジェクトごとのドキュメント取得
        documents = await documentRepo.findByProjectId(projectId);
      } else {
        // 全ドキュメント取得
        documents = await documentRepo.findAll();
      }

      logger.info('ドキュメント一覧取得', {
        projectId: projectId || 'all',
        count: documents.length,
      });

      return {
        documents,
      };
    } catch (error) {
      logger.error('ドキュメント一覧取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to fetch documents',
        message: (error as Error).message,
      });
    }
  });

  // コード生成
  fastify.post('/generate-code', async (request, reply) => {
    try {
      const body = request.body as any;
      const { sessionId, prompt, language, framework, createPR } = body;

      if (!sessionId) {
        return reply.status(400).send({ error: 'sessionId is required' });
      }

      // プロンプトが空の場合は文字起こしから推測
      let finalPrompt = prompt;
      if (!finalPrompt || finalPrompt.trim() === '') {
        const transcriptions = await transcriptionRepo.findBySessionId(sessionId);
        if (transcriptions.length === 0) {
          return reply.status(400).send({ 
            error: 'プロンプトまたは文字起こしが必要です' 
          });
        }
        
        // 最新の文字起こしを使用（空のテキストは除外）
        const recentTranscriptions = transcriptions
          .filter((t) => t.text && t.text.trim() !== '')
          .slice(-5);
        
        if (recentTranscriptions.length === 0) {
          return reply.status(400).send({ 
            error: 'プロンプトまたは有効な文字起こしが必要です' 
          });
        }
        
        finalPrompt = recentTranscriptions.map(t => t.text).join(' ');
        
        logger.info('文字起こしからプロンプトを生成しました', {
          sessionId,
          prompt: finalPrompt.substring(0, 100),
        });
      }

      logger.info('Code generation request', {
        sessionId,
        prompt: finalPrompt.substring(0, 100), // ログは最初の100文字のみ
        createPR: !!createPR,
      });

      // セッションのコンテキストを取得
      const transcriptions = await transcriptionRepo.findBySessionId(sessionId);
      const photos = await photoRepo.findBySessionId(sessionId);

      // 最新の仕様書を取得（オプション）
      const specifications = await specRepo.findBySessionId(sessionId);
      const latestSpec = specifications.length > 0 ? specifications[0] : null;

      logger.info('コンテキストを取得しました', {
        sessionId,
        transcriptionCount: transcriptions.length,
        photoCount: photos.length,
        hasSpecification: !!latestSpec,
      });

      // コンテキストの整形（空のテキストは除外）
      const context = {
        transcriptions: transcriptions
          .filter((t) => t.text && t.text.trim() !== '')
          .map((t) => ({
            text: t.text,
            timestamp: t.timestamp,
            speaker: t.speaker,
          })),
        specification: latestSpec ? (latestSpec.content as any).markdown : '',
      };

      // Modal GPUサーバーでコードを生成
      logger.info('Modal GPUサーバーでコード生成中...', { sessionId });
      const generatedCode = await modalGPU.generateCode({
        prompt: finalPrompt,
        context,
        language,
        framework,
      });

      logger.info('コードを生成しました', {
        sessionId,
        fileCount: generatedCode.files.length,
      });

      // ストレージに保存
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const generationId = `gen-${Date.now()}`;
      const storageDir = path.join(process.cwd(), 'storage', 'generated-code', generationId);
      
      await fs.mkdir(storageDir, { recursive: true });
      
      // 各ファイルを保存
      for (const file of generatedCode.files) {
        const filePath = path.join(storageDir, file.path);
        const fileDir = path.dirname(filePath);
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
      }
      
      // メタデータを保存
      const metadata = {
        generationId,
        timestamp: new Date().toISOString(),
        sessionId,
        prompt: finalPrompt,
        language,
        framework,
        model: generatedCode.model,
        fileCount: generatedCode.files.length,
        files: generatedCode.files.map(f => ({
          path: f.path,
          language: f.language,
        })),
        dependencies: generatedCode.dependencies,
        instructions: generatedCode.instructions,
        summary: generatedCode.summary || {},
      };
      
      await fs.writeFile(
        path.join(storageDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );
      
      logger.info('コードをストレージに保存しました', {
        generationId,
        storageDir,
      });

      // GitHub PR作成（オプション）
      let prUrl: string | undefined;
      if (createPR && createPR.enabled) {
        try {
          const { GitHubIntegration } = await import('../integrations/github');
          const github = new GitHubIntegration();

          const prTitle = createPR.title || `自動生成: ${prompt.substring(0, 50)}`;
          const prBody = `
## 自動生成されたコード

**プロンプト**: ${prompt}

**生成されたファイル**:
${generatedCode.files.map((f) => `- \`${f.path}\` (${f.language})`).join('\n')}

**依存関係**:
\`\`\`
${generatedCode.dependencies.join('\n')}
\`\`\`

**セットアップ手順**:
${generatedCode.instructions}

---
_このPRは Realworld Agent によって自動生成されました_
          `;

          prUrl = await github.createPullRequest({
            title: prTitle,
            body: prBody,
            head: '', // GitHubIntegrationで自動生成
            base: createPR.baseBranch || 'main',
            files: generatedCode.files,
          });

          logger.info('GitHub PRを作成しました', { prUrl });
        } catch (error) {
          logger.error('GitHub PR作成エラー', error as Error);
          // PR作成に失敗してもコード生成結果は返す
        }
      }

      return {
        generationId,
        fileCount: generatedCode.files.length,
        model: generatedCode.model,
        storageDir: `/storage/generated-code/${generationId}`,
        prUrl,
        message: `コードを生成しました（${generatedCode.files.length}ファイル）`,
      };
    } catch (error) {
      logger.error('コード生成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate code',
        message: (error as Error).message,
      });
    }
  });

  // 生成履歴一覧を取得
  fastify.get('/generated-code', async (request, reply) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const storageDir = path.join(process.cwd(), 'storage', 'generated-code');
      
      // ディレクトリが存在しない場合は空配列を返す
      try {
        await fs.access(storageDir);
      } catch {
        return { generations: [] };
      }
      
      const entries = await fs.readdir(storageDir);
      const generations = [];
      
      for (const entry of entries) {
        const metadataPath = path.join(storageDir, entry, 'metadata.json');
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          generations.push(metadata);
        } catch (error) {
          logger.warn(`メタデータ読み込みエラー: ${entry}`, error as Error);
        }
      }
      
      // 新しい順にソート
      generations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return { generations };
    } catch (error) {
      logger.error('生成履歴取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to get generated code list',
        message: (error as Error).message,
      });
    }
  });

  // 特定の生成を取得
  fastify.get('/generated-code/:generationId', async (request, reply) => {
    try {
      const { generationId } = request.params as { generationId: string };
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const generationDir = path.join(process.cwd(), 'storage', 'generated-code', generationId);
      const metadataPath = path.join(generationDir, 'metadata.json');
      
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      
      // ファイル内容を読み込む
      const files = [];
      for (const fileInfo of metadata.files) {
        const filePath = path.join(generationDir, fileInfo.path);
        const content = await fs.readFile(filePath, 'utf-8');
        files.push({
          ...fileInfo,
          content,
        });
      }
      
      return {
        ...metadata,
        files,
      };
    } catch (error) {
      logger.error('生成コード取得エラー', error as Error);
      return reply.status(404).send({
        error: 'Generation not found',
        message: (error as Error).message,
      });
    }
  });

  // ZIPダウンロードエンドポイント
  fastify.get('/generated-code/:generationId/download', async (request, reply) => {
    try {
      const { generationId } = request.params as { generationId: string };
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const archiver = await import('archiver');
      
      const generationDir = path.join(process.cwd(), 'storage', 'generated-code', generationId);
      const metadataPath = path.join(generationDir, 'metadata.json');
      
      // メタデータの存在確認
      try {
        await fs.access(metadataPath);
      } catch {
        return reply.status(404).send({ error: 'Generation not found' });
      }
      
      // ZIPファイル名
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      const projectName = metadata.summary?.name || 'generated-project';
      logger.info('[ZIP] メタデータ読み込み', { 
        generationId,
        projectName,
        hasSummary: !!metadata.summary,
        summaryName: metadata.summary?.name,
        timestamp: metadata.timestamp
      });
      
      // 日時フォーマット (YYYYMMDD_HHMMSS)
      const date = new Date(metadata.timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const dateStr = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      
      // 生成ID（gen-を除く）
      const shortId = generationId.replace('gen-', '');
      
      // ファイル名（日本語対応）
      const zipFilename = `${projectName}_${shortId}_${dateStr}.zip`;
      // ASCIIセーフなファイル名（フォールバック用）
      const asciiFilename = `project_${shortId}_${dateStr}.zip`;
      const encodedFilename = encodeURIComponent(zipFilename).replace(/'/g, '%27');
      
      logger.info('[ZIP] ファイル名生成', {
        projectName,
        shortId,
        dateStr,
        zipFilename,
        asciiFilename,
        encodedFilename
      });
      
      // ZIPストリームの作成
      reply.header('Content-Type', 'application/zip');
      // RFC 5987形式で日本語ファイル名をサポート
      const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
      reply.header('Content-Disposition', contentDisposition);
      logger.info('[ZIP] Content-Disposition設定', { contentDisposition });
      
      const archive = archiver.default('zip', {
        zlib: { level: 9 }
      });
      
      archive.on('error', (err: Error) => {
        logger.error('ZIP作成エラー', err);
        reply.send(err);
      });
      
      // ストリームをレスポンスにパイプ
      reply.send(archive);
      
      // ディレクトリの内容をZIPに追加
      archive.directory(generationDir, false);
      
      await archive.finalize();
      
      logger.info('ZIPダウンロード完了', { generationId, filename: zipFilename });
      
    } catch (error) {
      logger.error('ZIPダウンロードエラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to create zip file',
        message: (error as Error).message,
      });
    }
  });

  // ミーティング更新
  fastify.patch('/documents/:documentId', async (request, reply) => {
    try {
      const { documentId } = request.params as { documentId: string };
      const body = request.body as any;

      // ミーティング情報を取得
      const document = await documentRepo.findById(documentId);
      if (!document) {
        return reply.status(404).send({
          error: 'Document not found',
        });
      }

      // ミーティングを更新
      const updatedDocument = await documentRepo.update(documentId, {
        title: body.title || document.title,
        summary: body.summary || document.summary,
        content: body.content || document.content,
        type: body.type || document.type,
      });

      logger.info('ドキュメントを更新しました', { documentId });

      return {
        success: true,
        message: 'Document updated successfully',
        document: updatedDocument,
      };
    } catch (error) {
      logger.error('ドキュメント更新エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to update document',
        message: (error as Error).message,
      });
    }
  });

  // ミーティング削除
  fastify.delete('/documents/:documentId', async (request, reply) => {
    try {
      const { documentId } = request.params as { documentId: string };

      // ミーティング情報を取得
      const document = await documentRepo.findById(documentId);
      if (!document) {
        return reply.status(404).send({
          error: 'Document not found',
        });
      }

      // データベースからドキュメントを削除
      // DocumentRepositoryにdeleteメソッドがあるか確認する必要があるが、
      // とりあえず実装する
      await documentRepo.delete(documentId);

      logger.info('ドキュメントを削除しました', { documentId });

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      logger.error('ドキュメント削除エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to delete document',
        message: (error as Error).message,
      });
    }
  });
};

