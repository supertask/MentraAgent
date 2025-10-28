/**
 * Projects Router
 * プロジェクト管理API
 */

import type { FastifyPluginAsync } from 'fastify';
import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';

export const projectsRouter: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db as DatabaseService;
  const projectRepo = new ProjectRepository(db);
  const documentRepo = new DocumentRepository(db);

  // プロジェクト一覧取得
  fastify.get('/', async (request, reply) => {
    try {
      const projects = await projectRepo.findAll();

      // 各プロジェクトのドキュメント数を取得
      const projectsWithCount = await Promise.all(
        projects.map(async (project) => {
          const documentCount = await projectRepo.getDocumentCount(project.id);
          return {
            ...project,
            documentCount,
          };
        })
      );

      return { projects: projectsWithCount };
    } catch (error) {
      logger.error('プロジェクト一覧取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to get projects',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクト作成
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      const { name, githubRepo, githubBranch } = body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return reply.status(400).send({
          error: 'Invalid input',
          message: 'プロジェクト名は必須です',
        });
      }

      // 同名のプロジェクトが存在するかチェック
      const existing = await projectRepo.findByName(name.trim());
      if (existing) {
        return reply.status(409).send({
          error: 'Project already exists',
          message: 'このプロジェクト名は既に使用されています',
        });
      }

      const project = await projectRepo.create({
        name: name.trim(),
        githubRepo: githubRepo || undefined,
        githubBranch: githubBranch || 'main',
      });

      logger.info('プロジェクトを作成しました', {
        projectId: project.id,
        name: project.name,
      });

      return {
        project,
      };
    } catch (error) {
      logger.error('プロジェクト作成エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to create project',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクト詳細取得
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const project = await projectRepo.findById(id);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      const documentCount = await projectRepo.getDocumentCount(id);

      return {
        project: {
          ...project,
          documentCount,
        },
      };
    } catch (error) {
      logger.error('プロジェクト詳細取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to get project',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクトのドキュメント一覧取得
  fastify.get('/:id/documents', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const project = await projectRepo.findById(id);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      const documents = await documentRepo.findByProjectId(id);

      return {
        project,
        documents,
      };
    } catch (error) {
      logger.error('プロジェクトドキュメント取得エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to get project documents',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクト更新
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const { name, githubRepo, githubBranch } = body;

      const project = await projectRepo.findById(id);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      if (name) {
        // 同名のプロジェクトが存在するかチェック（自分以外）
        const existing = await projectRepo.findByName(name.trim());
        if (existing && existing.id !== id) {
          return reply.status(409).send({
            error: 'Project already exists',
            message: 'このプロジェクト名は既に使用されています',
          });
        }
      }

      const updatedProject = await projectRepo.update(id, {
        name: name ? name.trim() : undefined,
        githubRepo: githubRepo !== undefined ? githubRepo : undefined,
        githubBranch: githubBranch !== undefined ? githubBranch : undefined,
      });

      logger.info('プロジェクトを更新しました', {
        projectId: updatedProject.id,
        name: updatedProject.name,
      });

      return {
        project: updatedProject,
      };
    } catch (error) {
      logger.error('プロジェクト更新エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to update project',
        message: (error as Error).message,
      });
    }
  });

  // プロジェクト削除
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const project = await projectRepo.findById(id);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      await projectRepo.delete(id);

      logger.info('プロジェクトを削除しました', {
        projectId: id,
        name: project.name,
      });

      return {
        message: 'Project deleted successfully',
      };
    } catch (error) {
      logger.error('プロジェクト削除エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to delete project',
        message: (error as Error).message,
      });
    }
  });

  // ミーティングをプロジェクトに追加
  fastify.post('/:id/documents/:documentId', async (request, reply) => {
    try {
      const { id, documentId } = request.params as {
        id: string;
        documentId: string;
      };

      const project = await projectRepo.findById(id);
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
        });
      }

      const document = await documentRepo.findById(documentId);
      if (!document) {
        return reply.status(404).send({
          error: 'Document not found',
        });
      }

      await projectRepo.addDocument(id, documentId);

      logger.info('ドキュメントをプロジェクトに追加しました', {
        projectId: id,
        documentId,
      });

      return {
        message: 'Document added to project',
      };
    } catch (error) {
      logger.error('ドキュメント追加エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to add document to project',
        message: (error as Error).message,
      });
    }
  });

  // ミーティングをプロジェクトから削除
  fastify.delete('/:id/documents/:documentId', async (request, reply) => {
    try {
      const { id, documentId } = request.params as {
        id: string;
        documentId: string;
      };

      await projectRepo.removeDocument(id, documentId);

      logger.info('ドキュメントをプロジェクトから削除しました', {
        projectId: id,
        documentId,
      });

      return {
        message: 'Document removed from project',
      };
    } catch (error) {
      logger.error('ドキュメント削除エラー', error as Error);
      return reply.status(500).send({
        error: 'Failed to remove document from project',
        message: (error as Error).message,
      });
    }
  });
};


