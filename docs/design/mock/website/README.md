# RealworldAgent フロントエンドモック

RealworldAgentのフロントエンドUIの完全なモックです。app_barのModern Purple & Gradient Themeを採用し、全ページが動作する静的HTMLとして実装されています。

## 概要

このモックは、Google Meetミーティングから議事録・スクリーンショット抽出、コード生成までの全フローを視覚化します。

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
   - Cursor Agentセッション情報

4. **meetings.html** - ミーティング一覧
   - ミーティングカード
   - ステータスフィルター（すべて/完了/処理中）
   - 議事録Driveリンク、GitHub仕様書リンク

5. **video-analysis.html** - 動画解析状況
   - 解析情報カード
   - 処理ステップ（音声抽出、シーン検出、OCR、Vision分析、重要度スコアリング）
   - プログレスバーアニメーション
   - 抽出されたスクリーンショットグリッド

6. **processing-status.html** - 議事録処理状況
   - 処理済み/未処理議事録リスト
   - ステータスフィルター
   - 処理日時、セッションID表示
   - スキップ/再処理ボタン（未実装）

7. **code-generation.html** - コード生成状況
   - コード生成情報カード
   - 生成ファイル一覧
   - リアルタイムログビューアー
   - Cursor Agent進捗表示

8. **pull-requests.html** - PR確認
   - PRカード一覧
   - ステータスフィルター（すべて/オープン/マージ済み）
   - コード差分プレビュー
   - GitHubリンク

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
- 動画解析データ
- 議事録処理履歴データ
- コード生成データ
- Pull Requestデータ
- 通知データ
- ユーザー設定データ

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

- **ミーティング**: すべて/完了/処理中
- **議事録処理**: すべて/処理済み/未処理
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

- **3つのプロジェクト**: Project Alpha, Beta, Gamma
- **3つのミーティング**: 完了2件、処理中1件
- **3つの議事録処理履歴**: 処理済み2件、未処理1件
- **2つのコード生成**: 完了1件、処理中1件
- **3つのPull Request**: マージ済み1件、オープン2件
- **4つの通知**: 未読2件、既読2件

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
- ページ間のスムーズな遷移
- ローカルストレージによるデータ永続化
- ダークモード/ライトモード切り替え

## ライセンス

このモックはRealworldAgentプロジェクトの一部です。

## 作成者

RealworldAgent開発チーム

## 参考

- デザインベース: `docs/design/mock/app_bar/`
- システム設計: `docs/RealworldAgent_Diagrams.md`

