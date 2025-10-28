# RealworldAgent フロントエンドモック

RealworldAgentのフロントエンドUIの完全なモックです。app_barのModern Purple & Gradient Themeを採用し、全ページが動作する静的HTMLとして実装されています。

## 概要

このモックは、オンライン（Google Meet）・対面（Mentra Glass/ioデバイス）ミーティングから議事録・スクリーンショット抽出、コード生成までの全フローを視覚化します。

## デザイン

- **カラーテーマ**: Modern Purple & Gradient
  - Primary: `#6366f1` (Indigo)
  - Secondary: `#8b5cf6` (Purple)
  - Accent: `#ec4899` (Pink)
  - グラデーション: 135deg, Indigo → Purple → Pink
- **スタイル**: ダークテーマ、カードベースレイアウト
- **アニメーション**: プログレスバー、ステータス遷移、ホバーエフェクト

## ページ構成

### コアページ（8ページ）

1. **dashboard.html** - ダッシュボード
   - 統計カード（プロジェクト数、ミーティング数、PR数）
   - 最近のミーティング一覧
   - コード生成状況
   - 最近のPR
   - アクティビティタイムライン

2. **projects.html** - プロジェクト一覧
   - プロジェクトカードグリッド
   - 検索機能
   - 新規プロジェクト作成ボタン

3. **project-detail.html** - プロジェクト詳細
   - プロジェクト情報ヘッダー
   - ミーティング履歴
   - 議事録処理履歴
   - Pull Request履歴
   - **Cursor Agentセッション情報（スコープ別タブ表示）**
     - 各スコープ（frontend/backend/test/all/management）のセッションID
     - 作成日時、最終使用日時、処理済み議事録数

4. **meetings.html** - ミーティング一覧
   - ミーティングカード（オンライン・対面の区別表示）
   - ステータスフィルター（すべて/完了/処理中）
   - スコープフィルター、ミーティングタイプフィルター
   - 議事録Driveリンク、GitHub仕様書リンク
   - **カードクリックでミーティング詳細へ遷移**

5. **meeting-detail.html** - ミーティング詳細
   - ミーティング情報（オンライン/対面、スコープ表示）
   - **議事録生成状況**
     - 処理ステップ（オンライン: 8ステップ、対面: 7ステップ）
     - オンライン: 動画DL→音声抽出→シーン検出→SS抽出→OCR→Vision→統合→GitHub
     - 対面: 接続→リアルタイム音声→映像→OCR→Vision→統合→GitHub
   - プログレスバーアニメーション
   - 抽出されたスクリーンショットグリッド
   - GitHub保存リンク

6. **code-generation.html** - コード生成状況
   - **App Barで選択されたプロジェクトに絞り込み**
   - **スコープフィルター（一覧表示）**
   - **セッション別グルーピング表示**
     - アクティブセッション/クローズセッション区別
     - セッションごとのコード生成一覧
     - PR直リンク（GitHub）
   - コード生成詳細情報（ID指定時）
   - 生成ファイル一覧
   - リアルタイムログビューアー
   - Cursor Agent進捗表示

7. **~~pull-requests.html~~** → **削除（コード生成からGitHubへ直リンク）**

8. **~~video-analysis.html~~** → **meeting-detail.htmlへリダイレクト**

9. **~~processing-status.html~~** → **meeting-detail.htmlへリダイレクト**

10. **~~document-generation.html~~** → **削除（meeting-detail.htmlに統合）**

### 設定ページ（1ページ）

9. **settings.html** - 設定ハブ
   - Google連携設定
   - GitHub連携設定
   - Cursor Agent設定
   - Webhook設定

### エントリーポイント

10. **index.html** - dashboard.htmlへ自動リダイレクト

## 共通アセット

### assets/styles.css
- app_barのスタイルをベースに拡張
- カードコンポーネント
- プログレスバー・ステータスバッジ
- タイムライン表示
- ログビューアー
- スクリーンショットグリッド
- レスポンシブデザイン

### assets/common.js
- app_barのインタラクション（ハンバーガーメニュー、ドロップダウン等）
- 通知システム
- プログレスバーアニメーション
- ステータス遷移アニメーション
- ログストリーム
- カウントアップアニメーション

### assets/mock-data.js
- プロジェクトデータ
- ミーティングデータ（Meeting名形式: `<ProjectName>_<scope>_<title>`）
  - オンライン（Google Meet）: 録画後処理（3-10分）
  - 対面（Mentra Glass/ioデバイス）: リアルタイム処理（即座）
- 動画解析データ
  - オンライン: PySceneDetect、録画ダウンロード、一括処理
  - 対面: リアルタイムストリーム、即座処理
- 議事録処理履歴データ
- コード生成データ
- Pull Requestデータ
- 通知データ
- ユーザー設定データ
  - Google連携（オンライン）
  - GitHub連携
  - Cursor Agent設定
  - デバイス連携（対面）: Mentra Glass, ioデバイス, Modal GPU Server

#### Scope概念
各ミーティングには`scope`が設定され、対象ディレクトリを決定します：

- **frontend**: フロントエンドミーティング → `frontend/` 配下のコード生成
- **backend**: バックエンドミーティング → `backend/` 配下のコード生成
- **test**: テストミーティング → `test/` 配下のコード生成
- **all**: 開発全体ミーティング → プロジェクト全体のコード生成
- **management**: マネジメントミーティング → ドキュメント生成のみ

Meeting名の例：
- `ProjectAlpha_frontend_LoginUI`
- `ProjectAlpha_backend_AuthAPI`
- `ProjectAlpha_test_E2ETestStrategy`

#### Cursor Sessionのスコープ別管理（配列形式）

**v2.2の重要な変更点**: 各プロジェクトは**スコープごとに複数のCursor Agentセッション履歴**を持ちます。

```javascript
cursorSessions: {
  frontend: [
    { 
      sessionId: 'session_alpha_frontend_001', 
      createdAt: '2024-10-27T14:00:00Z', 
      lastUsed: '2024-10-27T15:25:00Z',
      documentsProcessed: 1,
      status: 'active',  // 現在アクティブなセッション
      closedAt: null,
      closedReason: null
    },
    { 
      sessionId: 'session_alpha_frontend_000', 
      createdAt: '2024-10-15T10:00:00Z', 
      lastUsed: '2024-10-26T18:00:00Z',
      documentsProcessed: 8,
      status: 'closed',  // 終了済みセッション
      closedAt: '2024-10-26T18:00:00Z',
      closedReason: 'Manually closed - context refresh'
    }
  ],
  backend: [
    { sessionId: 'session_alpha_backend_001', ... }
  ]
  // test, all, management...
}
```

**利点**:
- スコープごとに異なるコンテキストを保持
- frontendとbackendのセッションが干渉しない
- **セッション履歴を保持**（コンテキストリフレッシュ時の追跡）
- 各セッションの処理済み議事録数を独立管理
- プロジェクト詳細ページでアクティブ/過去セッションをタブ表示
- コード生成ページでセッション別にグルーピング表示

- ヘルパー関数

## 使い方

### ローカルで開く

1. このディレクトリをブラウザで開く:
```bash
cd docs/design/mock/website
open index.html  # macOS
# または
start index.html  # Windows
```

2. または、簡易サーバーを起動:
```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

3. ブラウザで `http://localhost:8000` を開く

### ナビゲーション

- **App Bar**: 左上のハンバーガーメニューから全ページにアクセス可能
- **プロジェクト選択**: App Barのプロジェクト名をクリックして切り替え
- **通知**: App Bar右側のベルアイコンで通知を確認
- **設定**: App Bar右側の3点アイコンから設定にアクセス

## 主要機能

### アニメーション

1. **プログレスバー**
   - 0%から目標値まで滑らかにアニメーション
   - easeOutCubic イージング
   - 処理中タスクで使用

2. **ステータス遷移**
   - pending → processing → completed
   - 色変化とアイコン変化
   - フェードアニメーション

3. **カウントアップ**
   - 統計値が0から目標値まで増加
   - ダッシュボードの統計カードで使用

4. **ログストリーム**
   - ログエントリーが順次表示
   - 自動スクロール
   - コード生成ページで使用

### フィルター機能

- **ミーティング**: 
  - ステータス: すべて/完了/処理中
  - スコープ: すべて/frontend/backend/test/all/management
  - タイプ: すべて/オンライン/対面
- **コード生成**: スコープ別（すべて/frontend/backend/test/all/management）
- **Pull Request**: すべて/オープン/マージ済み

### リアルタイム表示

- 通知バッジ（未読数）
- プログレスバー（処理進捗）
- ログビューアー（実行ログ）
- ステータスバッジ

## 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: カスタムプロパティ、グリッドレイアウト、アニメーション
- **JavaScript (Vanilla)**: モジュール化されたコード、イベントハンドリング
- **SVG**: アイコン

## レスポンシブ対応

- **モバイル (< 768px)**: 1カラムレイアウト
- **タブレット (768px - 1024px)**: 2カラムレイアウト
- **デスクトップ (> 1024px)**: 3-4カラムレイアウト

## ブラウザサポート

- Chrome (推奨)
- Firefox
- Safari
- Edge

モダンブラウザの最新版で動作します。

## モックデータ

すべてのデータは `assets/mock-data.js` で定義されています:

- **3つのプロジェクト**: Project Alpha, Beta, Gamma（**スコープ別Cursor Session管理**）
  - ProjectAlpha: frontend, backend, test, all の4セッション
  - ProjectBeta: frontend, backend, management の3セッション
  - ProjectGamma: frontend の1セッション
- **9つのミーティング**: 
  - オンライン: 6件（完了5件、処理中1件）
  - 対面: 3件（完了2件、処理中1件 - Mentra Glass使用）
- **議事録生成データ（mockDocumentGeneration）**: 3件
  - オンライン処理中1件、対面処理中1件、完了1件
  - 動画解析+議事録処理を統合したデータ構造
- **5つの議事録処理履歴**: 処理済み4件、未処理1件（**各処理にスコープ別セッションID**）
- **3つのコード生成**: 完了2件、処理中1件（**スコープとセッションID関連付け**）
- **5つのPull Request**: マージ済み3件、オープン2件
- **4つの通知**: 未読2件、既読2件
- **デバイス設定**: Mentra Glass（アクティブ）、ioデバイス（非アクティブ）、Modal GPU Server（設定済み）

## カスタマイズ

### カラーテーマを変更

`assets/styles.css` の `:root` セクションでカラー変数を変更:

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --accent: #ec4899;
  /* ... */
}
```

### モックデータを追加

`assets/mock-data.js` で配列に追加:

```javascript
mockProjects.push({
  id: 'project-delta-004',
  name: 'Project Delta',
  description: '新しいプロジェクト',
  // ...
});
```

## 注意事項

- これは静的HTMLモックです。実際のバックエンドAPIとの連携はありません。
- データはページリロード時にリセットされます。
- 一部のボタン（新規作成、スキップ等）は`alert()`で未実装を表示します。

## 今後の拡張

- Google Auth連携ページ（google-auth.html）
- GitHub Auth連携ページ（github-auth.html）
- デバイス登録ページ（device-registration.html）
- リアルタイムストリーム監視ページ
- スコープ別セッション管理ページ（session-management.html）
- ページ間のスムーズな遷移
- ローカルストレージによるデータ永続化
- ダークモード/ライトモード切り替え

## 変更履歴

### v2.2 (2024-10-28)
- **Cursor Session配列化**: スコープごとに複数セッション履歴を管理
  - アクティブセッション + 過去セッション（closed）
  - セッション終了理由の記録
  - プロジェクト詳細でアクティブ/過去セッション別表示
- **コード生成ページ**: セッション別グルーピング表示
  - セッションごとにコード生成をグループ化
  - 各コード生成からGitHub PR直リンク
- **pull-requests.html**: 削除（コード生成からPRへ直リンク）
- **ミーティング一覧**: 明示的な「処理状況を見る/詳細を見る」ボタン追加
- **ミーティング詳細**: コード生成セクション、関連PRセクション追加

### v2.1 (2024-10-28)
- **meeting-detail.html**: ミーティング詳細ページを新規作成
  - ミーティング情報と議事録生成状況を1ページで表示
  - ミーティング一覧からカードクリックで遷移
- **コード生成ページ**: App Barで選択されたプロジェクトに自動フィルタリング
- **document-generation.html**: 削除（meeting-detail.htmlに統合）
- **ナビゲーション**: 「議事録生成状況」メニューを削除（ミーティング詳細で確認）

### v2.0 (2024-10-28)
- **スコープ別Cursor Session管理**: プロジェクトごとに複数のスコープ別セッションを管理
- **コード生成ページ**: スコープフィルター追加、一覧表示機能
- **プロジェクト詳細**: スコープ別セッションタブ表示

## ライセンス

このモックはRealworldAgentプロジェクトの一部です。

## 作成者

RealworldAgent開発チーム

## 参考

- デザインベース: `docs/design/mock/app_bar/`
- システム設計: `docs/RealworldAgent_Diagrams.md`

