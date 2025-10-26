# Cursor Background Agent API - GitHubセットアップガイド

このガイドでは、Cursor Background Agent APIを使用するために必要なGitHub連携のセットアップ方法を説明します。

## 📋 前提条件

- Cursor APIキーが取得済みであること
- GitHubアカウントを持っていること
- 対象となるGitHubリポジトリがあること（新規作成も可）

## 🔧 セットアップ手順

### 1. Cursor GitHub Appのインストール

Cursor Background Agent APIを使用するには、Cursor GitHub Appをインストールし、対象リポジトリへのアクセスを許可する必要があります。

#### 手順:

1. **Cursor GitHub App インストールページにアクセス**
   ```
   https://cursor.com/api/auth/connect-github
   ```

2. **GitHubアカウントでログイン**
   - GitHubの認証画面が表示されます
   - Cursorにアクセスを許可します

3. **リポジトリの選択**
   - "All repositories"（すべてのリポジトリ）
   - または "Only select repositories"（特定のリポジトリのみ）
   
   ⚠️ **推奨**: セキュリティのため、必要なリポジトリのみを選択してください。

4. **インストールを完了**
   - "Install" ボタンをクリックしてインストールを完了します

### 2. GitHubリポジトリの準備

#### 既存のリポジトリを使用する場合:

リポジトリURLをコピーします:
```
https://github.com/username/repository-name
```

#### 新規リポジトリを作成する場合:

1. GitHubで新しいリポジトリを作成
2. リポジトリ名を決定（例: `my-awesome-project`）
3. Public または Private を選択
4. "Create repository" をクリック
5. リポジトリURLをコピー

### 3. プロジェクトの作成

RealworldAgentのWebインターフェースで新しいプロジェクトを作成します:

1. `http://localhost:5173/webcam.html` にアクセス
2. "📁 新規作成" ボタンをクリック
3. 以下の情報を入力:
   - **プロジェクト名**: プロジェクトの名前（必須）
   - **GitHubリポジトリURL**: `https://github.com/username/repository`（Cursor Agent用）
   - **ブランチ名**: デフォルトは `main`

#### 入力例:
```
プロジェクト名: ECサイトリニューアル
GitHubリポジトリURL: https://github.com/mycompany/ec-renewal
ブランチ名: main
```

### 4. 動作確認

1. **仕様書を作成**
   - 音声やテキストから仕様書を生成
   - プロジェクトに紐付ける

2. **Cursor Agentページに移動**
   ```
   http://localhost:5173/cursor-agent.html
   ```

3. **プランの生成**
   - プロジェクトを選択
   - 仕様書を選択
   - "📋 プランを作成" ボタンをクリック

4. **ビルドの実行**
   - プランが表示されたら "🚀 ビルドを実行" ボタンをクリック
   - Cursor APIが実際のコードを生成します

## 🔍 トラブルシューティング

### エラー: "You do not have access to repository"

**原因**: Cursor GitHub Appがリポジトリへのアクセス権限を持っていません。

**解決方法**:
1. [GitHub Settings > Applications](https://github.com/settings/installations) にアクセス
2. "Cursor" アプリを見つける
3. "Configure" をクリック
4. 対象リポジトリを追加
5. 変更を保存

### エラー: "Invalid creation request parameters - source is required"

**原因**: GitHubリポジトリURLが指定されていません。

**解決方法**:
1. プロジェクト設定を開く（実装予定）
2. GitHubリポジトリURLを追加
3. または、新しいプロジェクトを作成し直す

### エラー: "Repository does not exist"

**原因**: 指定したリポジトリが存在しないか、アクセス権限がありません。

**解決方法**:
1. リポジトリURLが正しいか確認
2. リポジトリが削除されていないか確認
3. GitHub上でリポジトリにアクセスできるか確認

## 📊 リポジトリの要件

Cursor Background Agent APIが使用するリポジトリには特別な要件はありませんが、以下を推奨します:

### 推奨事項:

1. **README.md** - プロジェクトの概要を記載
2. **.gitignore** - 適切な除外設定
3. **ライセンスファイル** - オープンソースの場合
4. **既存のコード構造** - 既存プロジェクトの場合

### サポートされるリポジトリタイプ:

- ✅ Public リポジトリ
- ✅ Private リポジトリ（Cursor GitHub App がインストール済み）
- ✅ 空のリポジトリ
- ✅ 既存のコードベース

## 🎯 使用例

### 例1: 新規プロジェクトの開発

```
1. GitHubで空のリポジトリを作成
2. RealworldAgentでプロジェクトを作成（GitHubリポジトリURLを指定）
3. 音声で要件を説明し、仕様書を生成
4. Cursor Agentでプランを作成
5. ビルドを実行してコードを生成
6. 生成されたコードをGitHubにプッシュ（手動またはGitHub統合機能）
```

### 例2: 既存プロジェクトの機能追加

```
1. 既存のGitHubリポジトリのURLを取得
2. RealworldAgentでプロジェクトを作成（既存リポジトリを指定）
3. 新機能の仕様書を作成
4. Cursor Agentでプランを作成（既存コードを考慮）
5. ビルドを実行して新機能のコードを生成
```

## 🔐 セキュリティに関する注意事項

1. **APIキーの管理**
   - APIキーは秘密にしてください
   - `.env` ファイルをGitにコミットしないでください
   - 定期的にAPIキーをローテーションしてください

2. **リポジトリのアクセス権限**
   - 必要最小限のリポジトリのみにアクセスを許可
   - Cursor GitHub Appの権限を定期的に確認

3. **コードレビュー**
   - 生成されたコードは必ずレビューしてください
   - 機密情報が含まれていないか確認

## 📚 関連ドキュメント

- [Cursor Background Agent API ドキュメント](https://cursor.com/ja/docs/background-agent/api/endpoints)
- [Cursor API認証ガイド](https://cursor.com/docs/api/authentication)
- [GitHub Apps ドキュメント](https://docs.github.com/en/apps)

## 💡 よくある質問

### Q: Private リポジトリは使用できますか？
A: はい、Cursor GitHub App がインストールされていれば使用できます。

### Q: 複数のリポジトリを使用できますか？
A: はい、プロジェクトごとに異なるリポジトリを指定できます。

### Q: GitHubリポジトリなしで使用できますか？
A: モック実装としては動作しますが、実際のCursor APIを使用するにはGitHubリポジトリが必須です。

### Q: ブランチを変更できますか？
A: はい、プロジェクト作成時または更新時にブランチ名を指定できます。

### Q: Organization のリポジトリは使用できますか？
A: はい、Organization に Cursor GitHub App をインストールすれば使用できます。

## 🚀 次のステップ

1. ✅ Cursor GitHub Appをインストール
2. ✅ テストリポジトリで動作確認
3. ✅ 実際のプロジェクトで使用開始
4. 📖 [使い方ガイド](./realworld_agent.md)を参照

---

**更新日**: 2025-10-26
**対象バージョン**: RealworldAgent v1.0

