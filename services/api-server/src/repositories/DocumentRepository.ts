/**
 * Document Repository
 * ドキュメント（仕様書・議事録）のデータアクセス層
 */

import type { DatabaseService } from '../services/DatabaseService';

export interface DocumentCreateInput {
  sessionId: string;
  title: string;
  summary: string;
  content: any; // JSON content
  type: 'specification' | 'minutes' | 'memo';
  projectIds?: string[]; // 関連付けるプロジェクトID
}

export interface Document {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  content: any;
  type: string;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentRepository {
  constructor(private db: DatabaseService) {}

  /**
   * ドキュメントを作成
   */
  async create(input: DocumentCreateInput): Promise<Document> {
    const { projectIds, ...documentData } = input;

    const document = await this.db.prisma!.document.create({
      data: {
        ...documentData,
        format: 'markdown',
      },
    });

    // プロジェクトとの関連付け
    if (projectIds && projectIds.length > 0) {
      await Promise.all(
        projectIds.map((projectId) =>
          this.db.prisma!.projectDocument.create({
            data: {
              projectId,
              documentId: document.id,
            },
          })
        )
      );
    }

    return document;
  }

  /**
   * 全てのドキュメントを取得
   */
  async findAll(): Promise<Document[]> {
    return await this.db.prisma!.document.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * IDでドキュメントを取得
   */
  async findById(id: string): Promise<Document | null> {
    return await this.db.prisma!.document.findUnique({
      where: { id },
    });
  }

  /**
   * セッションIDでドキュメントを取得
   */
  async findBySessionId(sessionId: string): Promise<Document[]> {
    return await this.db.prisma!.document.findMany({
      where: { sessionId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * プロジェクトIDでドキュメントを取得
   */
  async findByProjectId(projectId: string): Promise<Document[]> {
    const projectDocuments = await this.db.prisma!.projectDocument.findMany({
      where: { projectId },
      include: {
        document: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projectDocuments.map((pd) => pd.document);
  }

  /**
   * タイプでドキュメントを取得
   */
  async findByType(type: string): Promise<Document[]> {
    return await this.db.prisma!.document.findMany({
      where: { type },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ドキュメントを更新
   */
  async update(
    id: string,
    data: Partial<Omit<DocumentCreateInput, 'projectIds'>>
  ): Promise<Document> {
    return await this.db.prisma!.document.update({
      where: { id },
      data,
    });
  }

  /**
   * ドキュメントを削除
   */
  async delete(id: string): Promise<void> {
    await this.db.prisma!.document.delete({
      where: { id },
    });
  }

  /**
   * ドキュメントの関連プロジェクトIDを取得
   */
  async getProjectIds(documentId: string): Promise<string[]> {
    const projectDocuments = await this.db.prisma!.projectDocument.findMany({
      where: { documentId },
      select: { projectId: true },
    });

    return projectDocuments.map((pd) => pd.projectId);
  }

  /**
   * ドキュメントにプロジェクトを追加
   */
  async addToProject(documentId: string, projectId: string): Promise<void> {
    await this.db.prisma!.projectDocument.create({
      data: {
        projectId,
        documentId,
      },
    });
  }

  /**
   * ドキュメントからプロジェクトを削除
   */
  async removeFromProject(documentId: string, projectId: string): Promise<void> {
    await this.db.prisma!.projectDocument.deleteMany({
      where: {
        projectId,
        documentId,
      },
    });
  }
}


