// Mock Data for RealworldAgent Frontend

// プロジェクトデータ
const mockProjects = [
  {
    id: 'project-alpha-001',
    name: 'ProjectAlpha',
    description: 'eコマースプラットフォームの開発',
    status: 'active',
    repositoryUrl: 'https://github.com/supertask/ProjectAlpha',
    cursorSessions: {
      frontend: [
        { 
          sessionId: 'session_alpha_frontend_001', 
          createdAt: '2024-10-27T14:00:00Z', 
          lastUsed: '2024-10-27T15:25:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        },
        { 
          sessionId: 'session_alpha_frontend_000', 
          createdAt: '2024-10-15T10:00:00Z', 
          lastUsed: '2024-10-26T18:00:00Z',
          documentsProcessed: 8,
          status: 'closed',
          closedAt: '2024-10-26T18:00:00Z',
          closedReason: 'Manually closed - context refresh'
        }
      ],
      backend: [
        { 
          sessionId: 'session_alpha_backend_001', 
          createdAt: '2024-10-28T15:00:00Z', 
          lastUsed: '2024-10-28T15:00:00Z',
          documentsProcessed: 0,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ],
      test: [
        { 
          sessionId: 'session_alpha_test_001', 
          createdAt: '2024-10-25T12:00:00Z', 
          lastUsed: '2024-10-25T13:15:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ],
      all: [
        { 
          sessionId: 'session_alpha_all_001', 
          createdAt: '2024-10-24T09:00:00Z', 
          lastUsed: '2024-10-24T11:30:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ]
    },
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
    cursorSessions: {
      frontend: [
        { 
          sessionId: 'session_beta_frontend_001', 
          createdAt: '2024-10-26T10:00:00Z', 
          lastUsed: '2024-10-26T11:45:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ],
      backend: [
        { 
          sessionId: 'session_beta_backend_001', 
          createdAt: '2024-10-22T16:00:00Z', 
          lastUsed: '2024-10-22T17:20:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ],
      management: [
        { 
          sessionId: 'session_beta_management_001', 
          createdAt: '2024-10-23T13:00:00Z', 
          lastUsed: '2024-10-23T14:00:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ]
    },
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
    cursorSessions: {
      frontend: [
        { 
          sessionId: 'session_gamma_frontend_001', 
          createdAt: '2024-10-26T10:30:00Z', 
          lastUsed: '2024-10-26T11:15:00Z',
          documentsProcessed: 1,
          status: 'active',
          closedAt: null,
          closedReason: null
        }
      ]
    },
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
    meetingType: 'online', // オンライン or in_person
    deviceType: null, // オンラインの場合null、対面の場合 'mentra_glass' or 'io_device'
    date: '2024-10-27T14:00:00Z',
    duration: '45分',
    status: 'completed',
    processingTime: '8分', // オンライン: 3-10分、対面: 即座
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
    meetingType: 'online',
    deviceType: null,
    date: '2024-10-28T15:00:00Z',
    duration: '30分',
    status: 'processing',
    processingTime: '進行中',
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
    meetingType: 'online',
    deviceType: null,
    date: '2024-10-26T10:00:00Z',
    duration: '60分',
    status: 'completed',
    processingTime: '7分',
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
    meetingType: 'online',
    deviceType: null,
    date: '2024-10-25T11:00:00Z',
    duration: '50分',
    status: 'completed',
    processingTime: '6分',
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
    meetingType: 'in_person',
    deviceType: 'mentra_glass',
    date: '2024-10-24T09:00:00Z',
    duration: '90分',
    status: 'completed',
    processingTime: '即座',
    recordingUrl: null,
    transcriptUrl: null,
    githubDocUrl: 'https://github.com/supertask/ProjectAlpha/blob/main/Docs/Doc-meet_mno345-20241024_090000.md',
    screenshotCount: 25,
    realtimeProcessing: {
      streamConnected: true,
      audioStreamStatus: 'completed',
      videoStreamStatus: 'completed',
      totalFramesProcessed: 180,
      importantFramesExtracted: 25
    }
  },
  {
    id: 'meet_pqr678',
    projectId: 'project-beta-002',
    projectName: 'ProjectBeta',
    meetingName: 'ProjectBeta_management_SprintPlanning',
    scope: 'management',
    title: 'SprintPlanning',
    meetingType: 'online',
    deviceType: null,
    date: '2024-10-23T13:00:00Z',
    duration: '60分',
    status: 'completed',
    processingTime: '5分',
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
    meetingType: 'in_person',
    deviceType: 'io_device',
    date: '2024-10-22T16:00:00Z',
    duration: '45分',
    status: 'completed',
    processingTime: '即座',
    recordingUrl: null,
    transcriptUrl: null,
    githubDocUrl: 'https://github.com/supertask/ProjectBeta/blob/main/backend/Docs/Doc-meet_stu901-20241022_160000.md',
    screenshotCount: 14,
    realtimeProcessing: {
      streamConnected: true,
      audioStreamStatus: 'completed',
      videoStreamStatus: 'completed',
      totalFramesProcessed: 135,
      importantFramesExtracted: 14
    }
  },
  {
    id: 'meet_vwx234',
    projectId: 'project-gamma-003',
    projectName: 'ProjectGamma',
    meetingName: 'ProjectGamma_frontend_DashboardLayout',
    scope: 'frontend',
    title: 'DashboardLayout',
    meetingType: 'online',
    deviceType: null,
    date: '2024-10-26T10:30:00Z',
    duration: '40分',
    status: 'completed',
    processingTime: '4分',
    recordingUrl: 'https://drive.google.com/file/d/vwx234',
    transcriptUrl: 'https://docs.google.com/document/d/vwx234',
    githubDocUrl: 'https://github.com/supertask/ProjectGamma/blob/main/frontend/Docs/Doc-meet_vwx234-20241026_103000.md',
    screenshotCount: 10
  },
  // 新規追加: 対面ミーティング（処理中）
  {
    id: 'meet_xyz567',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_frontend_PaymentFlow',
    scope: 'frontend',
    title: 'PaymentFlow',
    meetingType: 'in_person',
    deviceType: 'mentra_glass',
    date: '2024-10-29T10:00:00Z',
    duration: '35分',
    status: 'processing',
    processingTime: '即座（進行中）',
    recordingUrl: null,
    transcriptUrl: null,
    githubDocUrl: null,
    screenshotCount: 8,
    processingStep: 'realtime_stream',
    processingProgress: 40,
    realtimeProcessing: {
      streamConnected: true,
      audioStreamStatus: 'processing',
      videoStreamStatus: 'processing',
      totalFramesProcessed: 72,
      importantFramesExtracted: 8
    }
  }
];

// 議事録生成データ（動画解析 + 議事録処理統合）
const mockDocumentGeneration = [
  {
    id: 'docgen_001',
    meetingId: 'meet_def456',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_backend_AuthAPI',
    scope: 'backend',
    meetingType: 'online',
    deviceType: null,
    status: 'processing',
    startedAt: '2024-10-28T15:32:00Z',
    steps: {
      videoDownload: { status: 'completed', progress: 100, startTime: '2024-10-28T15:32:00Z', endTime: '2024-10-28T15:34:30Z' },
      audioExtraction: { status: 'completed', progress: 100, startTime: '2024-10-28T15:34:30Z', endTime: '2024-10-28T15:36:00Z' },
      sceneDetection: { status: 'completed', progress: 100, startTime: '2024-10-28T15:36:00Z', endTime: '2024-10-28T15:38:15Z', scenesDetected: 42 },
      screenshotExtraction: { status: 'processing', progress: 65, startTime: '2024-10-28T15:38:15Z', framesProcessed: 27, totalFrames: 42 },
      ocrProcessing: { status: 'pending', progress: 0 },
      visionAnalysis: { status: 'pending', progress: 0 },
      documentIntegration: { status: 'pending', progress: 0 },
      githubCommit: { status: 'pending', progress: 0 }
    },
    screenshots: [
      { id: 'ss_001', timestamp: '00:02:15', importanceScore: 0.85, ocrText: 'ログイン画面のワイヤーフレーム' },
      { id: 'ss_002', timestamp: '00:05:42', importanceScore: 0.92, ocrText: 'API仕様書 - 認証エンドポイント' }
    ],
    documentStatus: 'pending',
    githubDocUrl: null,
    readyForCursorAgent: false,
    cursorAgentStatus: 'waiting'
  },
  {
    id: 'docgen_002',
    meetingId: 'meet_xyz567',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_frontend_PaymentFlow',
    scope: 'frontend',
    meetingType: 'in_person',
    deviceType: 'mentra_glass',
    status: 'processing',
    startedAt: '2024-10-29T10:00:00Z',
    realtimeSteps: {
      streamConnection: { status: 'connected', progress: 100, connectedAt: '2024-10-29T10:00:00Z' },
      realtimeAudio: { status: 'processing', progress: 40, framesProcessed: 72 },
      realtimeVideo: { status: 'processing', progress: 40, framesAnalyzed: 72, importantFrames: 8 },
      realtimeOCR: { status: 'processing', progress: 40 },
      realtimeVision: { status: 'processing', progress: 40 },
      documentIntegration: { status: 'pending', progress: 0 },
      githubCommit: { status: 'pending', progress: 0 }
    },
    screenshots: [
      { id: 'ss_rt_001', timestamp: '00:05:30', importanceScore: 0.88, ocrText: '決済フロー図' },
      { id: 'ss_rt_002', timestamp: '00:12:15', importanceScore: 0.91, ocrText: 'カード情報入力画面' }
    ],
    documentStatus: 'pending',
    githubDocUrl: null,
    readyForCursorAgent: false,
    cursorAgentStatus: 'waiting'
  },
  {
    id: 'docgen_003',
    meetingId: 'meet_abc123',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    meetingType: 'online',
    deviceType: null,
    status: 'completed',
    startedAt: '2024-10-27T14:08:00Z',
    completedAt: '2024-10-27T14:48:00Z',
    steps: {
      videoDownload: { status: 'completed', progress: 100 },
      audioExtraction: { status: 'completed', progress: 100 },
      sceneDetection: { status: 'completed', progress: 100, scenesDetected: 35 },
      screenshotExtraction: { status: 'completed', progress: 100, framesProcessed: 35, totalFrames: 35 },
      ocrProcessing: { status: 'completed', progress: 100 },
      visionAnalysis: { status: 'completed', progress: 100 },
      documentIntegration: { status: 'completed', progress: 100 },
      githubCommit: { status: 'completed', progress: 100 }
    },
    screenshots: [
      { id: 'ss_003', timestamp: '00:03:20', importanceScore: 0.90, ocrText: 'ログインフォーム設計' },
      { id: 'ss_004', timestamp: '00:08:15', importanceScore: 0.88, ocrText: '認証フロー図' }
    ],
    documentStatus: 'committed',
    githubDocUrl: 'https://github.com/supertask/ProjectAlpha/blob/main/frontend/Docs/Doc-meet_abc123-20241027_140000.md',
    readyForCursorAgent: true,
    cursorAgentStatus: 'completed',
    cursorSessionId: 'session_alpha_frontend_001'
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
    cursorSessionId: 'session_alpha_frontend_001',
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
    cursorSessionId: 'session_beta_frontend_001',
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
    cursorSessionId: 'session_alpha_test_001',
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
    cursorSessionId: 'session_beta_backend_001',
    prUrl: 'https://github.com/supertask/ProjectBeta/pull/42',
    prStatus: 'merged'
  }
];

// コード生成状況データ
const mockCodeGeneration = [
  {
    id: 'codegen_001',
    projectId: 'project-alpha-001',
    projectName: 'ProjectAlpha',
    meetingId: 'meet_abc123',
    meetingName: 'ProjectAlpha_frontend_LoginUI',
    scope: 'frontend',
    documentId: 'doc_abc123',
    status: 'completed',
    cursorSessionId: 'session_alpha_frontend_001',
    startedAt: '2024-10-27T14:50:00Z',
    completedAt: '2024-10-27T15:25:00Z',
    prUrl: 'https://github.com/supertask/ProjectAlpha/pull/123',
    prNumber: 123,
    prStatus: 'merged',
    prMergedAt: '2024-10-27T18:00:00Z',
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
    projectName: 'ProjectBeta',
    meetingId: 'meet_ghi789',
    meetingName: 'ProjectBeta_frontend_ChatWidget',
    scope: 'frontend',
    documentId: 'doc_ghi789',
    status: 'processing',
    cursorSessionId: 'session_beta_frontend_001',
    startedAt: '2024-10-26T11:30:00Z',
    completedAt: null,
    prUrl: null,
    prNumber: null,
    prStatus: null,
    prMergedAt: null,
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
    projectName: 'ProjectAlpha',
    meetingId: 'meet_jkl012',
    meetingName: 'ProjectAlpha_test_E2ETestStrategy',
    scope: 'test',
    documentId: 'doc_jkl012',
    status: 'completed',
    cursorSessionId: 'session_alpha_test_001',
    startedAt: '2024-10-25T12:00:00Z',
    completedAt: '2024-10-25T13:15:00Z',
    prUrl: 'https://github.com/supertask/ProjectAlpha/pull/115',
    prNumber: 115,
    prStatus: 'merged',
    prMergedAt: '2024-10-25T16:00:00Z',
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
  },
  devices: {
    mentraGlass: {
      connected: true,
      deviceId: 'mg_device_001',
      deviceName: 'Mentra Glass #1',
      streamEndpoint: 'https://api.realworldagent.com/stream/mentra-glass',
      lastConnected: '2024-10-29T10:00:00Z',
      status: 'active'
    },
    ioDevice: {
      connected: true,
      deviceId: 'io_device_001',
      deviceName: 'io Device #1',
      streamEndpoint: 'https://api.realworldagent.com/stream/io-device',
      lastConnected: '2024-10-22T16:00:00Z',
      status: 'inactive'
    },
    modalGPU: {
      configured: true,
      endpoint: 'https://modal.com/gpu-server',
      apiKey: 'modal_api_key_***'
    }
  },
  webhooks: {
    googleDrive: 'https://api.realworldagent.com/webhooks/google-drive',
    github: 'https://api.realworldagent.com/webhooks/github',
    deviceStream: 'https://api.realworldagent.com/webhooks/device-stream'
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
  
  // プロジェクトIDに紐づく議事録生成を取得
  getDocumentGenerationByProject: (projectId) => {
    return mockDocumentGeneration.filter(d => d.projectId === projectId);
  },
  
  // ミーティングIDから議事録生成を取得
  getDocumentGenerationByMeeting: (meetingId) => {
    return mockDocumentGeneration.find(d => d.meetingId === meetingId);
  },
  
  // アクティブなセッションを取得
  getActiveSession: (project, scope) => {
    if (!project || !project.cursorSessions || !project.cursorSessions[scope]) return null;
    return project.cursorSessions[scope].find(s => s.status === 'active');
  },
  
  // 全セッションを取得（アクティブ優先）
  getAllSessions: (project, scope) => {
    if (!project || !project.cursorSessions || !project.cursorSessions[scope]) return [];
    return project.cursorSessions[scope].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.lastUsed) - new Date(a.lastUsed);
    });
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
  },
  
  // ミーティングタイプの表示名を取得
  getMeetingTypeDisplayName: (meetingType) => {
    return meetingType === 'online' ? 'オンライン' : '対面';
  },
  
  // ミーティングタイプのバッジクラスを取得
  getMeetingTypeBadgeClass: (meetingType) => {
    return `meeting-type-badge meeting-type-badge-${meetingType}`;
  },
  
  // デバイスタイプの表示名を取得
  getDeviceTypeDisplayName: (deviceType) => {
    const deviceNames = {
      'mentra_glass': 'Mentra Glass',
      'io_device': 'ioデバイス'
    };
    return deviceNames[deviceType] || '';
  },
  
  // デバイスタイプのアイコンを取得
  getDeviceTypeIcon: (deviceType) => {
    const deviceIcons = {
      'mentra_glass': '👓',
      'io_device': '📹'
    };
    return deviceIcons[deviceType] || '';
  },
  
  // ミーティングタイプでフィルタリング
  filterByMeetingType: (meetings, meetingType) => {
    if (!meetingType || meetingType === 'all_types') return meetings;
    return meetings.filter(m => m.meetingType === meetingType);
  },
  
  // 議事録リンクを取得（オンライン: Google Docs、対面: RealworldAgent）
  getTranscriptLink: (meeting) => {
    if (meeting.meetingType === 'online') {
      return meeting.transcriptUrl;
    } else {
      // 対面の場合、RealworldAgentの議事録ページへのリンク（仮）
      return meeting.githubDocUrl;
    }
  }
};
