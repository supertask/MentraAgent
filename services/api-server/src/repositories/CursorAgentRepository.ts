/**
 * CursorAgent Repository
 * Cursor Agentセッションのデータアクセス層
 */

import type { DatabaseService } from '../services/DatabaseService';

export interface CursorAgentSessionCreateInput {
  projectId: string;
  documentIds: string[];
  status?: 'planning' | 'building' | 'completed' | 'error';
  plan?: any;
  build?: any;
  chatHistory?: any[];
  cursorWorkspaceId?: string;
  cursorAgentId?: string;
  cursorUrl?: string;
  branchName?: string;
}

export interface CursorAgentSession {
  id: string;
  projectId: string;
  documentIds: string[];
  status: string;
  plan: any;
  build: any;
  chatHistory: any[];
  cursorWorkspaceId: string | null;
  cursorAgentId: string | null;
  cursorUrl: string | null;
  branchName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CursorAgentRepository {
  constructor(private db: DatabaseService) {}

  /**
   * Cursor Agentセッションを作成
   */
  async create(input: CursorAgentSessionCreateInput): Promise<CursorAgentSession> {
    return await this.db.prisma!.cursorAgentSession.create({
      data: {
        projectId: input.projectId,
        documentIds: input.documentIds,
        status: input.status || 'planning',
        plan: input.plan || null,
        build: input.build || null,
        chatHistory: input.chatHistory || [],
        cursorWorkspaceId: input.cursorWorkspaceId || null,
        cursorAgentId: input.cursorAgentId || null,
        cursorUrl: input.cursorUrl || null,
        branchName: input.branchName || null,
      },
    });
  }

  /**
   * 全てのセッションを取得
   */
  async findAll(): Promise<CursorAgentSession[]> {
    return await this.db.prisma!.cursorAgentSession.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * IDでセッションを取得
   */
  async findById(id: string): Promise<CursorAgentSession | null> {
    return await this.db.prisma!.cursorAgentSession.findUnique({
      where: { id },
    });
  }

  /**
   * プロジェクトIDでセッションを取得
   */
  async findByProjectId(projectId: string): Promise<CursorAgentSession[]> {
    return await this.db.prisma!.cursorAgentSession.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * セッションを更新
   */
  async update(
    id: string,
    data: Partial<Omit<CursorAgentSessionCreateInput, 'projectId' | 'documentIds'>>
  ): Promise<CursorAgentSession> {
    return await this.db.prisma!.cursorAgentSession.update({
      where: { id },
      data,
    });
  }

  /**
   * チャット履歴を追加
   */
  async addChatMessage(
    id: string,
    message: { role: 'user' | 'assistant'; content: string; timestamp: string }
  ): Promise<CursorAgentSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const chatHistory = [...session.chatHistory, message];

    return await this.update(id, { chatHistory });
  }

  /**
   * プランを設定
   */
  async setPlan(
    id: string, 
    plan: any, 
    cursorUrl?: string, 
    branchName?: string,
    cursorAgentId?: string
  ): Promise<CursorAgentSession> {
    return await this.update(id, { 
      plan,
      cursorUrl,
      branchName,
      cursorAgentId,
      status: 'planning' 
    });
  }

  /**
   * ビルドを設定
   */
  async setBuild(
    id: string, 
    build: any,
    cursorUrl?: string, 
    branchName?: string,
    cursorAgentId?: string
  ): Promise<CursorAgentSession> {
    return await this.update(id, { 
      build,
      cursorUrl,
      branchName,
      cursorAgentId,
      status: 'completed' 
    });
  }

  /**
   * ステータスを更新
   */
  async updateStatus(
    id: string,
    status: 'planning' | 'building' | 'completed' | 'error'
  ): Promise<CursorAgentSession> {
    return await this.update(id, { status });
  }

  /**
   * セッションを削除
   */
  async delete(id: string): Promise<void> {
    await this.db.prisma!.cursorAgentSession.delete({
      where: { id },
    });
  }
}


