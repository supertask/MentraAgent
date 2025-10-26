/**
 * Cursor Agent Router
 * Cursor Agent統合API
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { CursorAgentService } from '../services/CursorAgentService';
import { CursorAgentRepository } from '../repositories/CursorAgentRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';
import path from 'path';
import { promises as fs } from 'fs';

export const cursorAgentRouter: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as DatabaseService;
  const cursorAgent = new CursorAgentService();
  const sessionRepo = new CursorAgentRepository(db);
  const projectRepo = new ProjectRepository(db);
  const documentRepo = new DocumentRepository(db);

  // セッション一覧取得
  fastify.get('/sessions', async (request, reply) => {
    try {
      const { projectId } = request.query as { projectId?: string };

      let sessions;
      if (projectId) {
        // プロジェクトごとのセッション取得
        sessions = await sessionRepo.findByProjectId(projectId);
      } else {
        // 全セッション取得
        sessions = await sessionRepo.findAll();
      }

      // プロジェクト情報を付加
      const sessionsWithProject = await Promise.all(
        sessions.map(async (session) => {
          const project = await projectRepo.findById(session.projectId);
          return {
            ...session,
            project: project ? {
              id: project.id,
              name: project.name,
              githubRepo: project.githubRepo,
              githubBranch: project.githubBranch,
              githubSubDirectory: project.githubSubDirectory,
            } : null,
          };
        })
      );

      return {
        sessions: sessionsWithProject,
      };
    } catch (error) {
      logger.error('セッション一覧取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to fetch sessions',
        message: (error as Error).message,
      });
    }
  });

  // セッション詳細取得
  fastify.get('/sessions/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found',
        });
      }

      const project = await projectRepo.findById(session.projectId);
      const documents = await Promise.all(
        session.documentIds.map((id) => documentRepo.findById(id))
      );

      // ビルド結果がある場合、README.mdとmetadata.jsonを読み込む
      let buildMetadata = null;
      let readme = null;
      
      if (session.build && typeof session.build === 'object') {
        const build = session.build as any;
        const buildId = build.buildId;
        
        if (buildId) {
          const buildDir = path.join(process.cwd(), 'storage', 'cursor-builds', buildId);
          const metadataPath = path.join(buildDir, 'metadata.json');
          const readmePath = path.join(buildDir, 'README.md');
          
          // metadata.jsonを読み込み
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            buildMetadata = JSON.parse(metadataContent);
          } catch (error) {
            // ファイルが存在しない場合は無視
          }
          
          // README.mdを読み込み
          try {
            readme = await fs.readFile(readmePath, 'utf-8');
          } catch (error) {
            // ファイルが存在しない場合は無視
          }
        }
      }

      return {
        session: {
          ...session,
          project: project ? {
            id: project.id,
            name: project.name,
            githubRepo: project.githubRepo,
            githubBranch: project.githubBranch,
            githubSubDirectory: project.githubSubDirectory,
          } : null,
          documents: documents.filter((doc) => doc !== null),
          buildMetadata,
          readme,
        },
      };
    } catch (error) {
      logger.error('セッション詳細取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to fetch session',
        message: (error as Error).message,
      });
    }
  });

  // セッション作成
  fastify.post('/sessions', async (request, reply) => {
    try {
      const body = request.body as any;
      const { projectId, documentIds } = body;

      if (!projectId) {
        return reply.status(400).send({
          error: 'projectId is required',
        });
      }

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return reply.status(400).send({
          error: 'documentIds is required and must be a non-empty array',
        });
      }

      // プロジェクトの存在確認
      const project = await projectRepo.findById(projectId);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      // セッションを作成
      const session = await sessionRepo.create({
        projectId,
        documentIds,
        status: 'planning',
      });

      logger.info('Cursor Agentセッションを作成しました', {
        sessionId: session.id,
        projectId,
        documentCount: documentIds.length,
      });

      return {
        session,
      };
    } catch (error) {
      logger.error('セッション作成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to create session',
        message: (error as Error).message,
      });
    }
  });

  // プラン作成
  fastify.post('/sessions/:sessionId/plan', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;
      const { additionalContext } = body;

      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found',
        });
      }

      // プロジェクトとドキュメントを取得
      const project = await projectRepo.findById(session.projectId);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      const documents = await Promise.all(
        session.documentIds.map((id) => documentRepo.findById(id))
      );

      const validDocuments = documents.filter((doc) => doc !== null);

      // 仕様書のmarkdownを抽出
      const specifications = validDocuments.map(
        (doc) => (doc!.content as any).markdown || ''
      );

      // Cursor Agentでプランを生成
      logger.info('Cursor Agentでプラン生成中...', {
        sessionId,
        projectName: project.name,
      });

      const plan = await cursorAgent.createPlan({
        projectName: project.name,
        specifications,
        additionalContext,
        githubRepo: project.githubRepo || undefined,
        githubBranch: project.githubBranch || undefined,
        githubSubDirectory: project.githubSubDirectory || undefined,
      });

      // セッションにプランとCursor情報を保存
      await sessionRepo.setPlan(
        sessionId, 
        plan,
        plan.cursorUrl,
        plan.branchName,
        undefined // cursorAgentId (planにはIDが含まれていないため)
      );

      logger.info('プラン生成完了', {
        sessionId,
        fileCount: plan.files.length,
        cursorUrl: plan.cursorUrl,
        branchName: plan.branchName,
      });

      return {
        plan,
        cursorUrl: plan.cursorUrl,
        branchName: plan.branchName,
      };
    } catch (error) {
      logger.error('プラン生成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to create plan',
        message: (error as Error).message,
      });
    }
  });

  // ビルド実行
  fastify.post('/sessions/:sessionId/build', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found',
        });
      }

      if (!session.plan) {
        return reply.status(400).send({
          error: 'Plan not found. Please create a plan first.',
        });
      }

      // プロジェクトとドキュメントを取得
      const project = await projectRepo.findById(session.projectId);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      const documents = await Promise.all(
        session.documentIds.map((id) => documentRepo.findById(id))
      );

      const validDocuments = documents.filter((doc) => doc !== null);

      const specifications = validDocuments.map(
        (doc) => (doc!.content as any).markdown || ''
      );

      // ステータスを更新
      await sessionRepo.updateStatus(sessionId, 'building');

      // Cursor Agentでビルド実行
      logger.info('Cursor Agentでビルド実行中...', {
        sessionId,
        projectName: project.name,
      });

      const result = await cursorAgent.executeBuild({
        projectName: project.name,
        specifications,
        plan: session.plan,
        githubRepo: project.githubRepo || undefined,
        githubBranch: project.githubBranch || undefined,
        githubSubDirectory: project.githubSubDirectory || undefined,
      });

      // 結果をストレージに保存
      const fs = await import('fs/promises');
      const path = await import('path');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const buildId = `build-${Date.now()}`;
      const storageDir = path.join(
        process.cwd(),
        'storage',
        'cursor-builds',
        buildId
      );

      await fs.mkdir(storageDir, { recursive: true });

      // 各ファイルを保存
      for (const file of result.files) {
        const filePath = path.join(storageDir, file.path);
        const fileDir = path.dirname(filePath);
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
      }

      // メタデータを保存
      const metadata = {
        buildId,
        sessionId,
        projectId: session.projectId,
        projectName: project.name,
        timestamp: new Date().toISOString(),
        status: result.status,
        fileCount: result.files.length,
        cursorUrl: result.cursorUrl,
        branchName: result.branchName,
        files: result.files.map((f) => ({
          path: f.path,
          language: f.language,
        })),
      };

      await fs.writeFile(
        path.join(storageDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      // セッションにビルド結果とCursor情報を保存
      await sessionRepo.setBuild(
        sessionId,
        {
          buildId,
          status: result.status,
          message: result.message,
          fileCount: result.files.length,
          storageDir: `/storage/cursor-builds/${buildId}`,
        },
        result.cursorUrl,
        result.branchName,
        undefined // cursorAgentId
      );

      logger.info('ビルド完了', {
        sessionId,
        buildId,
        fileCount: result.files.length,
        cursorUrl: result.cursorUrl,
        branchName: result.branchName,
      });

      return {
        buildId,
        status: result.status,
        message: result.message,
        fileCount: result.files.length,
        storageDir: `/storage/cursor-builds/${buildId}`,
        cursorUrl: result.cursorUrl,
        branchName: result.branchName,
      };
    } catch (error) {
      logger.error('ビルドエラー', error as Error);

      // セッションのステータスをエラーに更新
      try {
        const { sessionId } = request.params as { sessionId: string };
        await sessionRepo.updateStatus(sessionId, 'error');
      } catch (updateError) {
        logger.error('ステータス更新エラー', updateError as Error);
      }

      return reply.status(500).send({
        error: 'Failed to execute build',
        message: (error as Error).message,
      });
    }
  });

  // チャットメッセージ送信
  fastify.post('/sessions/:sessionId/chat', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;
      const { message } = body;

      if (!message || typeof message !== 'string') {
        return reply.status(400).send({
          error: 'message is required',
        });
      }

      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found',
        });
      }

      // ドキュメントを取得（コンテキスト用）
      const documents = await Promise.all(
        session.documentIds.map((id) => documentRepo.findById(id))
      );

      const validDocuments = documents.filter((doc) => doc !== null);
      const specifications = validDocuments.map(
        (doc) => (doc!.content as any).markdown || ''
      );

      // Cursor Agentにメッセージを送信
      const response = await cursorAgent.sendChatMessage(sessionId, message, {
        specifications,
        plan: session.plan,
      });

      // チャット履歴を保存
      await sessionRepo.addChatMessage(sessionId, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      await sessionRepo.addChatMessage(sessionId, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      });

      logger.info('チャットメッセージ処理完了', { sessionId });

      return {
        response: response.response,
      };
    } catch (error) {
      logger.error('チャットエラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to process chat message',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクトのセッション一覧取得
  fastify.get('/projects/:projectId/sessions', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };

      const sessions = await sessionRepo.findByProjectId(projectId);

      return {
        sessions,
      };
    } catch (error) {
      logger.error('セッション一覧取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to get sessions',
        message: (error as Error).message,
      });
    }
  });

  // セッション削除
  fastify.delete('/sessions/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };

      // セッション情報を取得
      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found',
        });
      }

      // ビルド結果のディレクトリを削除（存在する場合）
      if (session.build && typeof session.build === 'object') {
        const build = session.build as any;
        const buildId = build.buildId;
        
        if (buildId) {
          const buildDir = path.join(process.cwd(), 'storage', 'cursor-builds', buildId);
          try {
            await fs.rm(buildDir, { recursive: true, force: true });
            logger.info('ビルドディレクトリを削除しました', { buildDir });
          } catch (error) {
            logger.warn('ビルドディレクトリの削除に失敗しました', { buildDir, error });
          }
        }
      }

      // データベースからセッションを削除
      await sessionRepo.delete(sessionId);

      logger.info('セッションを削除しました', { sessionId });

      return {
        success: true,
        message: 'Session deleted successfully',
      };
    } catch (error) {
      logger.error('セッション削除エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to delete session',
        message: (error as Error).message,
      });
    }
  });
};


