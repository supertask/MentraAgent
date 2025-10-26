/**
 * Project Repository
 * プロジェクトのデータアクセス層
 */

import type { DatabaseService } from '../services/DatabaseService';

export interface ProjectCreateInput {
  name: string;
  githubRepo?: string;
  githubBranch?: string;
  githubSubDirectory?: string;
}

export interface Project {
  id: string;
  name: string;
  githubRepo: string | null;
  githubBranch: string | null;
  githubSubDirectory: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectRepository {
  constructor(private db: DatabaseService) {}

  /**
   * プロジェクトを作成
   */
  async create(input: ProjectCreateInput): Promise<Project> {
    return await this.db.prisma!.project.create({
      data: {
        name: input.name,
        githubRepo: input.githubRepo,
        githubBranch: input.githubBranch,
        githubSubDirectory: input.githubSubDirectory,
      },
    });
  }

  /**
   * 全てのプロジェクトを取得
   */
  async findAll(): Promise<Project[]> {
    return await this.db.prisma!.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * IDでプロジェクトを取得
   */
  async findById(id: string): Promise<Project | null> {
    return await this.db.prisma!.project.findUnique({
      where: { id },
    });
  }

  /**
   * 名前でプロジェクトを取得
   */
  async findByName(name: string): Promise<Project | null> {
    return await this.db.prisma!.project.findUnique({
      where: { name },
    });
  }

  /**
   * プロジェクトを更新
   */
  async update(id: string, data: Partial<ProjectCreateInput>): Promise<Project> {
    return await this.db.prisma!.project.update({
      where: { id },
      data,
    });
  }

  /**
   * プロジェクトを削除
   */
  async delete(id: string): Promise<void> {
    await this.db.prisma!.project.delete({
      where: { id },
    });
  }

  /**
   * プロジェクトのドキュメント数を取得
   */
  async getDocumentCount(projectId: string): Promise<number> {
    return await this.db.prisma!.projectDocument.count({
      where: { projectId },
    });
  }

  /**
   * プロジェクトにドキュメントを関連付け
   */
  async addDocument(projectId: string, documentId: string): Promise<void> {
    await this.db.prisma!.projectDocument.create({
      data: {
        projectId,
        documentId,
      },
    });
  }

  /**
   * プロジェクトからドキュメントの関連付けを削除
   */
  async removeDocument(projectId: string, documentId: string): Promise<void> {
    await this.db.prisma!.projectDocument.deleteMany({
      where: {
        projectId,
        documentId,
      },
    });
  }
}


