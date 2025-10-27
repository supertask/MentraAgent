# RealworldAgent シーケンス図（更新版）

## 1. 仕様書作成フロー（ProjectA）

```mermaid
sequenceDiagram
    participant User
    participant ProjectA as ProjectA<br/>(Web Client)
    participant PhotoCapture as 写真撮影<br/>& 文字起こし
    participant DocGenerator as ドキュメント<br/>ジェネレータ
    participant RWARepo as RealworldAgent<br/>GeneratedCodes<br/>(pj/ProjectA/main)

    User->>ProjectA: 「仕様書作成」ボタンをクリック
    ProjectA->>PhotoCapture: 写真撮影リクエスト
    PhotoCapture->>PhotoCapture: 写真撮影実行
    PhotoCapture->>PhotoCapture: 音声文字起こし
    PhotoCapture-->>ProjectA: 写真 + テキスト返却

    ProjectA->>DocGenerator: ドキュメント生成リクエスト<br/>(写真 + テキスト)
    DocGenerator->>DocGenerator: マークダウン形式で<br/>ドキュメント生成<br/>(Doc1.md, Doc2.md...)
    DocGenerator->>RWARepo: コミット<br/>/Docs/Doc{N}.md<br/>/Docs/images/***

    RWARepo-->>ProjectA: 仕様書保存完了
    ProjectA-->>User: ドキュメント作成完了表示
```

## 2. コード生成フロー（新規プロジェクト）

```mermaid
sequenceDiagram
    participant RWARepo as RealworldAgent<br/>GeneratedCodes
    participant CodeGenerator as コード生成<br/>エンジン
    participant CursorBgAgent as Cursor Background<br/>Agent
    participant FeatureBranch as RealworldAgent<br/>GeneratedCodes<br/>(pj/ProjectA/feature/initial)

    Note over RWARepo: 新規プロジェクト検出<br/>(pj/ProjectA/main に<br/>複数のDocが存在)

    RWARepo->>CodeGenerator: すべてのDocを読み込み<br/>(Doc1.md, Doc2.md, ...)
    CodeGenerator->>CodeGenerator: Docベースで<br/>コード生成プロンプト作成

    CodeGenerator->>CursorBgAgent: コード生成リクエスト<br/>(Docの内容)
    CursorBgAgent->>CursorBgAgent: Background Agentで<br/>コード生成実行<br/>(セッション保存)

    CursorBgAgent->>CursorBgAgent: セッション内で<br/>ソースコード生成
    CursorBgAgent-->>CodeGenerator: 生成されたコード<br/>(複数ファイル)

    CodeGenerator->>FeatureBranch: ブランチ作成<br/>pj/ProjectA/feature/initial
    CodeGenerator->>FeatureBranch: コミット<br/>/src/***<br/>/package.json<br/>/README.md

    FeatureBranch-->>CodeGenerator: コード保存完了
    CodeGenerator-->>ProjectA: コード生成完了通知
```

## 3. コード生成フロー（プロジェクト更新）

```mermaid
sequenceDiagram
    participant User
    participant ProjectA as ProjectA
    participant RWARepo as RealworldAgent<br/>GeneratedCodes<br/>(pj/ProjectA/main)
    participant DiffDetector as 差分検出<br/>エンジン
    participant CodeGenerator as コード生成<br/>エンジン
    participant CursorBgAgent as Cursor Background<br/>Agent
    participant FeatureBranch as pj/ProjectA/feature/**<br/>(既存)

    User->>ProjectA: 新しい仕様書作成
    ProjectA->>RWARepo: Doc{N+1}.md保存<br/>/Docs/

    RWARepo->>DiffDetector: 新しいDocと<br/>前回のDocの差分検出<br/>(Doc{N}.md vs Doc{N+1}.md)
    DiffDetector->>DiffDetector: 差分内容を抽出

    DiffDetector->>CodeGenerator: 差分内容を送付<br/>(追加・変更・削除部分)
    CodeGenerator->>CodeGenerator: 差分ベースで<br/>コード更新プロンプト作成<br/>（既存コンテキストは<br/>Cursor Agentが保持）

    CodeGenerator->>CursorBgAgent: コード更新リクエスト<br/>(差分内容)
    CursorBgAgent->>CursorBgAgent: Background Agentで<br/>コード更新実行<br/>(セッション更新)

    CursorBgAgent-->>CodeGenerator: 更新されたコード

    CodeGenerator->>FeatureBranch: プッシュ<br/>/src/***<br/>(差分適用)

    FeatureBranch-->>CodeGenerator: コード更新完了
    CodeGenerator-->>ProjectA: コード更新完了通知
    ProjectA-->>User: 更新完了表示
```

## 4. cursor_agent.htmlでの確認フロー

```mermaid
sequenceDiagram
    participant User
    participant Browser as ブラウザ
    participant CursorAgentHTML as cursor_agent.html
    participant SessionStorage as Session Storage<br/>(Local/IndexedDB)
    participant RWARepo as RealworldAgent<br/>GeneratedCodes<br/>(GitHub API)

    User->>Browser: cursor_agent.htmlを開く
    Browser->>CursorAgentHTML: ページ読み込み

    CursorAgentHTML->>SessionStorage: Cursor Background Agent<br/>セッション情報取得
    SessionStorage-->>CursorAgentHTML: セッション情報<br/>(ID, Timeline, Context)

    CursorAgentHTML->>CursorAgentHTML: セッション内容を<br/>可視化表示<br/>・生成時刻<br/>・入力Prompt<br/>・生成ステップ

    CursorAgentHTML->>RWARepo: pj/ProjectA/feature/**<br/>のソースコード取得<br/>(GitHub API)

    RWARepo-->>CursorAgentHTML: ソースコード一覧<br/>├─ src/***<br/>├─ package.json<br/>└─ README.md

    CursorAgentHTML->>CursorAgentHTML: ソースコード表示<br/>・ファイルツリー<br/>・コード内容（シンタックス<br/>ハイライト）

    CursorAgentHTML-->>User: セッション + ソースコード<br/>の統合表示
```

---

## フロー説明

### シーケンス1: 仕様書作成フロー
**目的**: Projectで「仕様書作成」ボタンから自動でドキュメント生成  
**主要ステップ**:
1. 写真撮影 + 文字起こし
2. ドキュメント自動生成（マークダウン形式）
3. `pj/<ProjectName>/main` ブランチの `/Docs/` に保存
4. インクリメント保存: Doc1.md, Doc2.md, Doc3.md...（競合なし）
5. 画像は `/Docs/images/` に保存

**所要時間**: 2-10秒

---

### シーケンス2: コード生成フロー（新規プロジェクト）
**目的**: 新規プロジェクトの場合、すべてのDocをベースにコード生成  
**主要ステップ**:
1. 新規プロジェクト検出（`pj/<ProjectName>/main` に複数のDoc存在）
2. すべてのDocを読み込み
3. Cursor Background Agentでコード生成実行
   - セッションはCursor Agentが保存
   - ソースコード生成
4. `pj/<ProjectName>/feature/initial` ブランチに保存
5. 生成されたコード:
   - `/src/***`
   - `/package.json`
   - `/README.md`

**特徴**:
- セッション保存により、以降の更新時にコンテキスト保持
- ソースコードはCursor Agentが管理

---

### シーケンス3: コード生成フロー（プロジェクト更新）
**目的**: 仕様書更新時に、差分をベースにコード自動更新  
**主要ステップ**:
1. 新しい仕様書作成（Doc{N+1}.md）
2. 差分検出: Doc{N}.md vs Doc{N+1}.md
3. Cursor Background Agentでコード更新
   - セッションは前回のものを継続
   - 差分のみをベースにコード更新
4. `pj/<ProjectName>/feature/**` ブランチを更新

**特徴**:
- ソースコードはCursor Agentセッション内に保持
- APIサーバー側ではDoc差分のみを管理
- コンテキスト保持により、正確な更新が可能

---

### シーケンス4: cursor_agent.htmlでの確認フロー
**目的**: Cursor Background Agentのセッション＋生成コードの統合確認  
**表示内容**:
1. **セッション情報**
   - Background Agent ID
   - セッションタイムライン
   - コンテキスト内容
   - 生成時刻

2. **ソースコード表示**
   - ファイルツリー（フォルダ構造）
   - コード内容（シンタックスハイライト付き）
   - ファイル一覧

**データ源**:
- セッション情報: Local/IndexedDB
- ソースコード: GitHub API（`pj/<ProjectName>/feature/**` ブランチ）

---

## リポジトリ構造

### RealworldAgentGeneratedCodes

```
RealworldAgentGeneratedCodes/
│
├── pj/ProjectA/
│   │
│   ├── main (branch)                        # 仕様書・ドキュメント
│   │   ├── Docs/
│   │   │   ├── Doc1.md
│   │   │   ├── Doc2.md
│   │   │   ├── Doc3.md
│   │   │   └── images/
│   │   │       ├── img1.png
│   │   │       └── img2.png
│   │   └── ...
│   │
│   └── feature/** (branches)                 # ソースコード
│       ├── feature/initial
│       │   ├── src/
│       │   ├── package.json
│       │   ├── README.md
│       │   └── tsconfig.json
│       ├── feature/v2
│       │   ├── src/
│       │   ├── package.json
│       │   └── ...
│       └── feature/v3
│           └── ...
│
├── pj/ProjectB/
│   ├── main (branch)
│   │   └── Docs/
│   │       └── Doc1.md
│   │
│   └── feature/** (branches)
│       └── feature/initial
│           └── ...
│
└── pj/ProjectC/
    ├── main (branch)
    │   └── Docs/
    │
    └── feature/** (branches)
        └── ...
```

---

## 実装チェックリスト

- [ ] 仕様書作成時のインクリメント機構（Doc{N}.mdの自動採番）
- [ ] 画像保存機構（Docs/images/への自動振り分け）
- [ ] 新規/更新の自動判定ロジック
- [ ] Doc差分検出エンジン
- [ ] Cursor Background Agent統合
- [ ] GitHub API連携（pj/<ProjectName>/feature/*** ブランチの作成・更新）
- [ ] cursor_agent.htmlの開発
  - [ ] Session Storage からセッション情報取得
  - [ ] GitHub APIでコード取得
  - [ ] 統合表示UI

---

## 5. ステートマシン図（プロジェクトライフサイクル）

```mermaid
stateDiagram-v2
    [*] --> Idle: プロジェクト作成

    Idle --> CreatingDocument: 「仕様書作成」ボタン<br/>クリック

    CreatingDocument --> DocumentCreated: ドキュメント生成<br/>完了

    DocumentCreated --> CheckingProjectStatus: プロジェクト状態<br/>確認

    CheckingProjectStatus --> DetectingNewProject: 新規プロジェクト<br/>(Doc1.mdのみ)
    CheckingProjectStatus --> DetectingProjectUpdate: プロジェクト更新<br/>(複数Docが存在)

    DetectingNewProject --> GeneratingCodeInitial: すべてのDocから<br/>コード生成開始

    DetectingProjectUpdate --> DetectingDocDiff: Doc差分検出

    DetectingDocDiff --> GeneratingCodeUpdate: 差分ベースで<br/>コード生成開始

    GeneratingCodeInitial --> CodeGenerating: Cursor Agent<br/>実行中

    GeneratingCodeUpdate --> CodeGenerating

    CodeGenerating --> CodeGenerated: コード生成<br/>完了

    CodeGenerated --> CommittingCode: ブランチへ<br/>コミット

    CommittingCode --> Idle: 完成<br/>セッション保存

    CodeGenerating --> ErrorOccurred: エラー発生
    ErrorOccurred --> Idle: エラーリカバリ

    Idle --> SessionReview: cursor_agent.html<br/>でセッション確認

    SessionReview --> Idle: 確認完了
```

---

## 6. アクティビティ図（仕様書作成〜コード生成フロー）

```mermaid
graph TD
    A["「仕様書作成」ボタン<br/>クリック"] --> B["写真撮影開始"]
    B --> C["写真撮影完了"]
    C --> D["音声文字起こし実行"]
    D --> E["文字起こし完了"]

    E --> F["ドキュメント<br/>ジェネレータに送付"]
    F --> G["マークダウン形式で<br/>ドキュメント生成"]
    G --> H["Doc番号を<br/>決定"]

    H --> I["Docs/に<br/>保存完了"]
    I --> J["画像を<br/>Docs/images/に保存"]

    J --> K{"プロジェクト<br/>状態確認"}

    K -->|新規プロジェクト<br/>Doc1.mdのみ| L["すべてのDocを<br/>読み込み"]
    K -->|プロジェクト更新<br/>複数Doc存在| M["差分検出<br/>エンジン実行"]

    M --> N["Doc差分を<br/>抽出"]
    N --> O["差分内容を<br/>Code Generatorに送付"]

    L --> P["コード生成用<br/>プロンプト作成"]
    O --> P

    P --> Q["Cursor Background<br/>Agent実行"]
    Q --> R{"コード生成<br/>成功?"}

    R -->|失敗| S["エラーハンドリング"]
    S --> T["ユーザーに<br/>通知"]
    T --> U["エラー記録"]

    R -->|成功| V{"新規プロジェクト<br/>or 更新?"}

    V -->|新規| W["ブランチ作成<br/>pj/ProjectName/<br/>feature/initial"]
    V -->|更新| X["既存ブランチ<br/>pj/ProjectName/<br/>feature/**<br/>を更新"]

    W --> Y["生成コード<br/>をコミット"]
    X --> Y

    Y --> Z["セッション<br/>情報保存"]
    Z --> AA["GitHub Pagesで<br/>セッション表示<br/>準備"]

    AA --> AB["cursor_agent.html<br/>から確認可能"]
    AB --> AC["完了"]

    U --> AC

    style Q fill:#e1f5ff
    style Z fill:#c8e6c9
    style AC fill:#fff9c4
```

---

## ステートマシン図の説明

### 状態遷移

| 状態 | 説明 | 遷移先 |
|------|------|--------|
| **Idle** | 待機状態 | CreatingDocument / SessionReview |
| **CreatingDocument** | ドキュメント作成中 | DocumentCreated |
| **DocumentCreated** | ドキュメント作成完了 | CheckingProjectStatus |
| **CheckingProjectStatus** | プロジェクト状態確認 | DetectingNewProject / DetectingProjectUpdate |
| **DetectingNewProject** | 新規プロジェクト検出 | GeneratingCodeInitial |
| **DetectingProjectUpdate** | 既存プロジェクト検出 | DetectingDocDiff |
| **DetectingDocDiff** | ドキュメント差分検出 | GeneratingCodeUpdate |
| **GeneratingCodeInitial** | 新規コード生成準備 | CodeGenerating |
| **GeneratingCodeUpdate** | 更新コード生成準備 | CodeGenerating |
| **CodeGenerating** | Cursor Agent実行中 | CodeGenerated / ErrorOccurred |
| **CodeGenerated** | コード生成完了 | CommittingCode |
| **CommittingCode** | ブランチへコミット | Idle |
| **ErrorOccurred** | エラー発生 | Idle |
| **SessionReview** | cursor_agent.htmlで確認 | Idle |

### 重要な分岐点

1. **プロジェクト状態判定**
   - 新規プロジェクト: `Doc1.md` のみ存在 → すべてのDocでコード生成
   - プロジェクト更新: 複数のDoc存在 → 差分検出後にコード生成

2. **コード生成結果**
   - 成功: ブランチ作成/更新へ進む
   - 失敗: エラーハンドリング → リトライまたは通知

3. **ブランチ選択**
   - 新規: `pj/<ProjectName>/feature/initial` 作成
   - 更新: 既存の `pj/<ProjectName>/feature/**` を更新

---

## アクティビティ図の説明

### フロー構成

**フェーズ1: 入力収集（写真・文字起こし）**
- 写真撮影 → 文字起こし → ドキュメント生成 → 画像分類

**フェーズ2: プロジェクト状態判定**
- 新規 vs 更新の自動判定
- 新規の場合: すべてのDoc読み込み
- 更新の場合: Doc差分検出

**フェーズ3: コード生成実行**
- Cursor Background Agent起動
- セッション保存
- 成功/失敗判定

**フェーズ4: ブランチ操作**
- 新規プロジェクト: `pj/<ProjectName>/feature/initial` 作成
- 既存プロジェクト: 既存ブランチ更新

**フェーズ5: 完了処理**
- セッション情報保存
- cursor_agent.htmlで表示可能な状態に

### 例外処理

- **エラー発生時の処理**:
  1. エラーハンドリング実行
  2. ユーザーに通知
  3. ログに記録
  4. Idleへ戻る

### 並列処理（潜在的）

将来的には以下を並列化可能：
- 画像処理と文字起こし
- 複数ファイルのコード生成
- キャッシュ処理とDB保存
