// Mock Data for RealworldAgent Frontend

// プロジェクトデータ
const mockProjects = [
  {
    id: 'project-alpha-001',
    name: 'ProjectAlpha',
    description: 'eコマースプラットフォームの開発',
    status: 'active',
    repositoryUrl: 'https://github.com/supertask/ProjectAlpha',
    cursorSessionId: 'session_abc123xyz',
    createdAt: '2024-10-15T10:00:00Z',
    lastUpdated: '2024-10-28T15:30:00Z',
    meetingCount: 8,
    documentCount: 12,
    prCount: 15
  },
  {
    id: 'project-beta-002',
    name: 'ProjectBeta',
    description: 'AIチャットボットシステム',
    status: 'active',
    repositoryUrl: 'https://github.com/supertask/ProjectBeta',
    cursorSessionId: 'session_def456uvw',
    createdAt: '2024-10-20T14:00:00Z',
    lastUpdated: '2024-10-27T18:45:00Z',
    meetingCount: 5,
    documentCount: 7,
    prCount: 9
  },
  {
    id: 'project-gamma-003',
    name: 'ProjectGamma',
    description: 'データ分析ダッシュボード',
    status: 'active',
    repositoryUrl: 'https://github.com/supertask/ProjectGamma',
    cursorSessionId: null,
    createdAt: '2024-10-25T09:00:00Z',
    lastUpdated: '2024-10-26T12:00:00Z',
    meetingCount: 2,
    documentCount: 3,
    prCount: 1
  }
];

// ミーティングデータ
const mockMeetings = [
  {
    id: 'meet_abc123',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    title: 'LoginUI',
    date: '2024-10-27T14:00:00Z',
    duration: '45分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/abc123',
    transcriptUrl: 'https://docs.google.com/document/d/abc123',
    githubDocUrl: 'https://github.com/supertask/ProjectAlpha/blob/main/frontend/Docs/Doc-meet_abc123-20241027_140000.md',
    screenshotCount: 12
  },
  {
    id: 'meet_def456',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_backend_AuthAPI',
    scope: 'backend',
    title: 'AuthAPI',
    date: '2024-10-28T15:00:00Z',
    duration: '30分',
    status: 'processing',
    recordingUrl: 'https://drive.google.com/file/d/def456',
    transcriptUrl: null,
    githubDocUrl: null,
    screenshotCount: 0,
    processingStep: 'video_analysis',
    processingProgress: 65
  },
  {
    id: 'meet_ghi789',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingName: 'ProjectBeta_frontend_ChatWidget',
    scope: 'frontend',
    title: 'ChatWidget',
    date: '2024-10-26T10:00:00Z',
    duration: '60分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/ghi789',
    transcriptUrl: 'https://docs.google.com/document/d/ghi789',
    githubDocUrl: 'https://github.com/supertask/ProjectBeta/blob/main/frontend/Docs/Doc-meet_ghi789-20241026_100000.md',
    screenshotCount: 18
  },
  {
    id: 'meet_jkl012',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_test_E2ETestStrategy',
    scope: 'test',
    title: 'E2ETestStrategy',
    date: '2024-10-25T11:00:00Z',
    duration: '50分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/jkl012',
    transcriptUrl: 'https://docs.google.com/document/d/jkl012',
    githubDocUrl: 'https://github.com/supertask/ProjectAlpha/blob/main/test/Docs/Doc-meet_jkl012-20241025_110000.md',
    screenshotCount: 8
  },
  {
    id: 'meet_mno345',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_all_Architecture',
    scope: 'all',
    title: 'Architecture',
    date: '2024-10-24T09:00:00Z',
    duration: '90分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/mno345',
    transcriptUrl: 'https://docs.google.com/document/d/mno345',
    githubDocUrl: 'https://github.com/supertask/ProjectAlpha/blob/main/Docs/Doc-meet_mno345-20241024_090000.md',
    screenshotCount: 25
  },
  {
    id: 'meet_pqr678',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingName: 'ProjectBeta_management_SprintPlanning',
    scope: 'management',
    title: 'SprintPlanning',
    date: '2024-10-23T13:00:00Z',
    duration: '60分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/pqr678',
    transcriptUrl: 'https://docs.google.com/document/d/pqr678',
    githubDocUrl: 'https://github.com/supertask/ProjectBeta/blob/main/Docs/Doc-meet_pqr678-20241023_130000.md',
    screenshotCount: 5
  },
  {
    id: 'meet_stu901',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingName: 'ProjectBeta_backend_DatabaseSchema',
    scope: 'backend',
    title: 'DatabaseSchema',
    date: '2024-10-22T16:00:00Z',
    duration: '45分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/stu901',
    transcriptUrl: 'https://docs.google.com/document/d/stu901',
    githubDocUrl: 'https://github.com/supertask/ProjectBeta/blob/main/backend/Docs/Doc-meet_stu901-20241022_160000.md',
    screenshotCount: 14
  },
  {
    id: 'meet_vwx234',
    projectId: 'project-gamma-003',
    projectName: 'ProjectGamma',
    meetingName: 'ProjectGamma_frontend_DashboardLayout',
    scope: 'frontend',
    title: 'DashboardLayout',
    date: '2024-10-26T10:30:00Z',
    duration: '40分',
    status: 'completed',
    recordingUrl: 'https://drive.google.com/file/d/vwx234',
    transcriptUrl: 'https://docs.google.com/document/d/vwx234',
    githubDocUrl: 'https://github.com/supertask/ProjectGamma/blob/main/frontend/Docs/Doc-meet_vwx234-20241026_103000.md',
    screenshotCount: 10
  }
];

// 動画解析データ
const mockVideoAnalysis = [
  {
    id: 'analysis_001',
    meetingId: 'meet_def456',
    status: 'processing',
    steps: {
      audioExtraction: { status: 'completed', progress: 100, startTime: '2024-10-28T15:35:00Z', endTime: '2024-10-28T15:36:30Z' },
      sceneDetection: { status: 'completed', progress: 100, startTime: '2024-10-28T15:36:30Z', endTime: '2024-10-28T15:38:15Z', scenesDetected: 42 },
      ocrProcessing: { status: 'processing', progress: 65, startTime: '2024-10-28T15:38:15Z', framesProcessed: 27, totalFrames: 42 },
      visionAnalysis: { status: 'pending', progress: 0 },
      importanceScoring: { status: 'pending', progress: 0 }
    },
    screenshots: [
      { id: 'ss_001', timestamp: '00:02:15', importanceScore: 0.85, ocrText: 'ログイン画面のワイヤーフレーム' },
      { id: 'ss_002', timestamp: '00:05:42', importanceScore: 0.92, ocrText: 'API仕様書 - 認証エンドポイント' }
    ]
  }
];

// 議事録処理履歴データ
const mockProcessingHistory = [
  {
    id: 'proc_001',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_abc123',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    documentId: 'doc_abc123',
    documentFilename: 'Doc-meet_abc123-20241027_140000.md',
    status: 'processed',
    processedAt: '2024-10-27T14:50:00Z',
    cursorSessionId: 'session_abc123xyz',
    prUrl: 'https://github.com/supertask/ProjectAlpha/pull/123',
    prStatus: 'merged'
  },
  {
    id: 'proc_002',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_def456',
    meetingName: 'ProjectAlpha_backend_AuthAPI',
    scope: 'backend',
    documentId: 'doc_def456',
    documentFilename: 'Doc-meet_def456-20241028_150000.md',
    status: 'pending',
    processedAt: null,
    cursorSessionId: null,
    prUrl: null,
    prStatus: null
  },
  {
    id: 'proc_003',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingId: 'meet_ghi789',
    meetingName: 'ProjectBeta_frontend_ChatWidget',
    scope: 'frontend',
    documentId: 'doc_ghi789',
    documentFilename: 'Doc-meet_ghi789-20241026_100000.md',
    status: 'processed',
    processedAt: '2024-10-26T11:30:00Z',
    cursorSessionId: 'session_def456uvw',
    prUrl: 'https://github.com/supertask/ProjectBeta/pull/45',
    prStatus: 'open'
  },
  {
    id: 'proc_004',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_jkl012',
    meetingName: 'ProjectAlpha_test_E2ETestStrategy',
    scope: 'test',
    documentId: 'doc_jkl012',
    documentFilename: 'Doc-meet_jkl012-20241025_110000.md',
    status: 'processed',
    processedAt: '2024-10-25T12:00:00Z',
    cursorSessionId: 'session_abc123xyz',
    prUrl: 'https://github.com/supertask/ProjectAlpha/pull/115',
    prStatus: 'merged'
  },
  {
    id: 'proc_005',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingId: 'meet_stu901',
    meetingName: 'ProjectBeta_backend_DatabaseSchema',
    scope: 'backend',
    documentId: 'doc_stu901',
    documentFilename: 'Doc-meet_stu901-20241022_160000.md',
    status: 'processed',
    processedAt: '2024-10-22T17:15:00Z',
    cursorSessionId: 'session_def456uvw',
    prUrl: 'https://github.com/supertask/ProjectBeta/pull/42',
    prStatus: 'merged'
  }
];

// コード生成状況データ
const mockCodeGeneration = [
  {
    id: 'codegen_001',
    projectId: 'project-alpha-001',
    meetingId: 'meet_abc123',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    documentId: 'doc_abc123',
    status: 'completed',
    cursorSessionId: 'session_abc123xyz',
    startedAt: '2024-10-27T14:50:00Z',
    completedAt: '2024-10-27T15:25:00Z',
    filesGenerated: [
      { path: 'frontend/src/components/LoginForm.tsx', linesAdded: 150, linesDeleted: 0 },
      { path: 'frontend/src/services/authService.ts', linesAdded: 85, linesDeleted: 12 },
      { path: 'frontend/src/types/auth.types.ts', linesAdded: 45, linesDeleted: 0 }
    ],
    logs: [
      { timestamp: '14:50:15', level: 'info', message: 'Cursor Agent セッション開始' },
      { timestamp: '14:51:30', level: 'info', message: '仕様書解析完了 (scope: frontend)' },
      { timestamp: '14:55:00', level: 'info', message: 'frontend/src/components/LoginForm.tsx 生成中...' },
      { timestamp: '15:10:00', level: 'info', message: 'frontend/src/services/authService.ts 更新中...' },
      { timestamp: '15:25:00', level: 'success', message: 'コード生成完了' }
    ]
  },
  {
    id: 'codegen_002',
    projectId: 'project-beta-002',
    meetingId: 'meet_ghi789',
    meetingName: 'ProjectBeta_frontend_ChatWidget',
    scope: 'frontend',
    documentId: 'doc_ghi789',
    status: 'processing',
    cursorSessionId: 'session_def456uvw',
    startedAt: '2024-10-26T11:30:00Z',
    completedAt: null,
    filesGenerated: [
      { path: 'frontend/src/components/ChatWidget.tsx', linesAdded: 120, linesDeleted: 0 }
    ],
    logs: [
      { timestamp: '11:30:15', level: 'info', message: 'Cursor Agent セッション開始' },
      { timestamp: '11:32:00', level: 'info', message: '仕様書解析完了 (scope: frontend)' },
      { timestamp: '11:35:00', level: 'info', message: 'frontend/src/components/ChatWidget.tsx 生成中...' },
      { timestamp: '11:50:00', level: 'info', message: 'コンポーネント構造生成完了' }
    ]
  },
  {
    id: 'codegen_003',
    projectId: 'project-alpha-001',
    meetingId: 'meet_jkl012',
    meetingName: 'ProjectAlpha_test_E2ETestStrategy',
    scope: 'test',
    documentId: 'doc_jkl012',
    status: 'completed',
    cursorSessionId: 'session_abc123xyz',
    startedAt: '2024-10-25T12:00:00Z',
    completedAt: '2024-10-25T13:15:00Z',
    filesGenerated: [
      { path: 'test/e2e/auth.spec.ts', linesAdded: 180, linesDeleted: 0 },
      { path: 'test/e2e/helpers/auth.helper.ts', linesAdded: 65, linesDeleted: 0 },
      { path: 'test/fixtures/users.json', linesAdded: 25, linesDeleted: 0 }
    ],
    logs: [
      { timestamp: '12:00:15', level: 'info', message: 'Cursor Agent セッション開始' },
      { timestamp: '12:01:30', level: 'info', message: '仕様書解析完了 (scope: test)' },
      { timestamp: '12:05:00', level: 'info', message: 'test/e2e/auth.spec.ts 生成中...' },
      { timestamp: '13:15:00', level: 'success', message: 'コード生成完了' }
    ]
  }
];

// Pull Request データ
const mockPullRequests = [
  {
    id: 'pr_123',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_abc123',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    number: 123,
    title: 'feat(frontend): ログイン機能実装',
    description: 'Google Meetミーティング (Doc-meet_abc123-20241027_140000.md) の仕様に基づいてログイン機能を実装',
    status: 'merged',
    branch: 'frontend/feature/update-from-meet_abc123',
    url: 'https://github.com/supertask/ProjectAlpha/pull/123',
    createdAt: '2024-10-27T15:30:00Z',
    mergedAt: '2024-10-27T18:00:00Z',
    filesChanged: 3,
    additions: 280,
    deletions: 12,
    commits: 1
  },
  {
    id: 'pr_124',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: null,
    meetingName: null,
    scope: 'frontend',
    number: 124,
    title: 'feat(frontend): パスワードリセット機能',
    description: 'ユーザーがパスワードを忘れた場合のリセット機能を追加',
    status: 'open',
    branch: 'frontend/feature/password-reset',
    url: 'https://github.com/supertask/ProjectAlpha/pull/124',
    createdAt: '2024-10-28T10:00:00Z',
    mergedAt: null,
    filesChanged: 5,
    additions: 350,
    deletions: 8,
    commits: 2
  },
  {
    id: 'pr_45',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingId: 'meet_ghi789',
    meetingName: 'ProjectBeta_frontend_ChatWidget',
    scope: 'frontend',
    number: 45,
    title: 'feat(frontend): チャットウィジェットUI実装',
    description: 'Google Meetミーティング (Doc-meet_ghi789-20241026_100000.md) で設計したUIを実装',
    status: 'open',
    branch: 'frontend/feature/update-from-meet_ghi789',
    url: 'https://github.com/supertask/ProjectBeta/pull/45',
    createdAt: '2024-10-26T11:45:00Z',
    mergedAt: null,
    filesChanged: 8,
    additions: 520,
    deletions: 45,
    commits: 1
  },
  {
    id: 'pr_115',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_jkl012',
    meetingName: 'ProjectAlpha_test_E2ETestStrategy',
    scope: 'test',
    number: 115,
    title: 'test: E2Eテスト戦略実装',
    description: 'Google Meetミーティング (Doc-meet_jkl012-20241025_110000.md) で策定したテスト戦略を実装',
    status: 'merged',
    branch: 'test/feature/update-from-meet_jkl012',
    url: 'https://github.com/supertask/ProjectAlpha/pull/115',
    createdAt: '2024-10-25T13:20:00Z',
    mergedAt: '2024-10-25T16:30:00Z',
    filesChanged: 3,
    additions: 270,
    deletions: 0,
    commits: 1
  },
  {
    id: 'pr_42',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingId: 'meet_stu901',
    meetingName: 'ProjectBeta_backend_DatabaseSchema',
    scope: 'backend',
    number: 42,
    title: 'feat(backend): データベーススキーマ設計',
    description: 'Google Meetミーティング (Doc-meet_stu901-20241022_160000.md) で設計したスキーマを実装',
    status: 'merged',
    branch: 'backend/feature/update-from-meet_stu901',
    url: 'https://github.com/supertask/ProjectBeta/pull/42',
    createdAt: '2024-10-22T17:20:00Z',
    mergedAt: '2024-10-22T20:15:00Z',
    filesChanged: 6,
    additions: 425,
    deletions: 35,
    commits: 1
  }
];

// 通知データ
const mockNotifications = [
  {
    id: 'notif_001',
    type: 'meeting_detected',
    title: '新しいミーティングを検出',
    message: 'ProjectAlpha_backend_AuthAPI',
    timestamp: '2024-10-28T15:05:00Z',
    read: false,
    link: 'meetings.html?id=meet_def456'
  },
  {
    id: 'notif_002',
    type: 'pr_created',
    title: 'Pull Request作成完了',
    message: 'ProjectAlpha #123: feat(frontend): ログイン機能実装',
    timestamp: '2024-10-27T15:30:00Z',
    read: false,
    link: 'pull-requests.html?id=pr_123'
  },
  {
    id: 'notif_003',
    type: 'pr_merged',
    title: 'Pull Requestがマージされました',
    message: 'ProjectAlpha #123: feat(frontend): ログイン機能実装',
    timestamp: '2024-10-27T18:00:00Z',
    read: true,
    link: 'pull-requests.html?id=pr_123'
  },
  {
    id: 'notif_004',
    type: 'code_generation_complete',
    title: 'コード生成完了',
    message: 'ProjectBeta_frontend_ChatWidget',
    timestamp: '2024-10-26T12:15:00Z',
    read: true,
    link: 'code-generation.html?id=codegen_002'
  }
];

// ダッシュボード統計データ
const mockDashboardStats = {
  totalProjects: 3,
  activeProjects: 3,
  totalMeetings: 15,
  thisWeekMeetings: 5,
  totalPRs: 22,
  openPRs: 2,
  processingTasks: 1
};

// ユーザー設定データ
const mockUserSettings = {
  google: {
    connected: true,
    email: 'lightfox.task@gmail.com',
    driveWebhookUrl: 'https://api.realworldagent.com/webhooks/google-drive',
    scopes: ['drive.readonly', 'docs.readonly']
  },
  github: {
    connected: true,
    username: 'supertask',
    webhookUrl: 'https://api.realworldagent.com/webhooks/github',
    repositories: ['supertask/ProjectAlpha', 'supertask/ProjectBeta', 'supertask/ProjectGamma']
  },
  cursor: {
    apiKeyConfigured: true,
    defaultModel: 'claude-sonnet-4'
  }
};

// ヘルパー関数
const MockDataHelpers = {
  // プロジェクトIDからプロジェクトを取得
  getProjectById: (projectId) => {
    return mockProjects.find(p => p.id === projectId);
  },
  
  // プロジェクトIDに紐づくミーティングを取得
  getMeetingsByProject: (projectId) => {
    return mockMeetings.filter(m => m.projectId === projectId);
  },
  
  // プロジェクトIDに紐づく処理履歴を取得
  getProcessingHistoryByProject: (projectId) => {
    return mockProcessingHistory.filter(p => p.projectId === projectId);
  },
  
  // 未読通知を取得
  getUnreadNotifications: () => {
    return mockNotifications.filter(n => !n.read);
  },
  
  // 最近のミーティングを取得（日付降順）
  getRecentMeetings: (limit = 5) => {
    return [...mockMeetings]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },
  
  // scopeでフィルタリング
  filterByScope: (items, scope) => {
    if (!scope || scope === 'all_scopes') return items;
    return items.filter(item => item.scope === scope);
  },
  
  // Meeting名をパース
  parseMeetingName: (meetingName) => {
    const parts = meetingName.split('_');
    return {
      projectName: parts[0],
      scope: parts[1],
      title: parts.slice(2).join('_')
    };
  },
  
  // scopeの表示名を取得
  getScopeDisplayName: (scope) => {
    const scopeNames = {
      'frontend': 'フロントエンド',
      'backend': 'バックエンド',
      'test': 'テスト',
      'all': '全体',
      'management': 'マネジメント'
    };
    return scopeNames[scope] || scope;
  },
  
  // scopeのバッジクラスを取得
  getScopeBadgeClass: (scope) => {
    return `scope-badge scope-badge-${scope}`;
  },
  
  // 相対時間表示
  formatRelativeTime: (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
  },
  
  // 日時フォーマット
  formatDateTime: (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
