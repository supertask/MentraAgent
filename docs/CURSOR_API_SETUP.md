# Cursor Background Agent API セットアップガイド

このドキュメントでは、Realworld AgentでCursor Background Agent APIを使用するためのセットアップ方法を説明します。

## 📋 前提条件

- Cursorエディタの有料プラン（Pro以上）に加入していること
- Node.js 18以降がインストールされていること
- PostgreSQL、Redis、Dockerが起動していること

## 🔑 Step 1: Cursor API Keyの取得

### 1.1 Cursor設定画面を開く

1. Cursorエディタを開く
2. 左下の⚙️アイコン（Settings）をクリック
3. 「API Keys」セクションに移動

### 1.2 APIキーを生成

1. 「Generate API Key」ボタンをクリック
2. 生成されたAPIキーをコピー（この画面でのみ表示されます）
3. 安全な場所に保存

> ⚠️ **重要**: APIキーは一度しか表示されません。必ず安全な場所に保存してください。

公式ドキュメント: [Cursor Background Agent API](https://cursor.com/docs/background-agent/api/endpoints)

## 🔧 Step 2: 環境変数の設定

### 2.1 .envファイルを編集

```bash
cd /Users/tasuku/Projects/RealworldAgent/services/api-server
```

`.env`ファイルに以下を追加/更新：

```bash
# Cursor Background Agent API
CURSOR_API_KEY=your_api_key_here
CURSOR_API_URL=https://api.cursor.sh
```

### 2.2 APIキーを設定

上記の`your_api_key_here`を、Step 1で取得したAPIキーに置き換えます。

```bash
# 例:
CURSOR_API_KEY=sk-cursor-1234567890abcdef
CURSOR_API_URL=https://api.cursor.sh
```

## 🚀 Step 3: サービスの再起動

環境変数を読み込むため、APIサーバーを再起動します。

```bash
# 現在実行中のAPIサーバーを停止
# Ctrl+C または以下のコマンド
pkill -f "bun.*dev:api"

# APIサーバーを再起動
cd /Users/tasuku/Projects/RealworldAgent
bun run dev:api
```

## ✅ Step 4: 動作確認

### 4.1 ログを確認

APIサーバーの起動ログで以下を確認：

```bash
# ✅ 正しく設定されている場合
🚀 API Server listening on http://0.0.0.0:3000

# ❌ APIキーが未設定の場合
⚠️ Cursor API Keyが設定されていません
```

### 4.2 実際に使ってみる

1. **ブラウザでWebクライアントを開く**
   ```
   http://localhost:5173/webcam.html
   ```

2. **プロジェクトを作成**
   - 「➕ 新規プロジェクト」をクリック
   - プロジェクト名を入力（例: "テストプロジェクト"）

3. **録画を開始して仕様を話す**
   - 「開始」ボタンをクリック
   - マイクに向かって作りたいものの仕様を説明
   - 例: "ユーザー認証機能を持つWebアプリを作りたいです"

4. **ドキュメントを生成**
   - 「📄 ミーティング生成」ボタンをクリック
   - プロジェクトを選択
   - 「📝 生成する」をクリック

5. **Cursor Agentで実装**
   - `http://localhost:5173/documents.html` を開く
   - 「🤖 Cursor Agentで実装」ボタンをクリック
   - プロジェクトとドキュメントを選択
   - 「🎯 Planを生成」→「🚀 Buildを実行」

### 4.3 生成されたコードを確認

```bash
# 生成されたコードの保存先
ls -la /Users/tasuku/Projects/RealworldAgent/services/api-server/storage/cursor-builds/
```

## 🔄 モック実装とのフォールバック

APIキーが未設定の場合、システムは自動的にモック実装にフォールバックします：

```typescript
// ログ出力例
[warn]: Cursor API Keyが未設定のため、モック実装を使用します
```

これにより、APIキーなしでも基本的な機能をテストできます。

## 📚 API仕様

### 利用可能なエンドポイント

実装されているCursor Background Agent APIの機能：

1. **Agent実行** (`/agents/execute`)
   - プラン生成
   - コード実装

2. **Chat完了** (`/chat/completions`)
   - 対話形式での修正指示
   - 追加機能の実装

詳細: [Cursor API Endpoints](https://cursor.com/docs/background-agent/api/endpoints)

## 🐛 トラブルシューティング

### 問題: APIキーが認識されない

**症状:**
```
[warn]: Cursor API Keyが設定されていません
```

**解決策:**
1. `.env`ファイルが正しいパスにあるか確認
2. `.env`ファイルの内容を確認（スペースや改行がないか）
3. APIサーバーを再起動

### 問題: API呼び出しがエラーになる

**症状:**
```
[error]: Cursor API Error: 401 - Unauthorized
```

**解決策:**
1. APIキーが正しいか確認
2. Cursorの有料プランが有効か確認
3. APIキーの有効期限を確認

### 問題: 生成されたコードが空

**症状:**
```
[warn]: モック実装にフォールバックします
```

**解決策:**
1. ネットワーク接続を確認
2. Cursor APIのステータスページを確認
3. APIのレート制限に達していないか確認

## 📖 参考リンク

- [Cursor Background Agent API Documentation](https://cursor.com/docs/background-agent/api/endpoints)
- [Cursor Pricing](https://cursor.com/pricing)
- [Cursor Community](https://forum.cursor.sh/)

## 🔐 セキュリティ

- APIキーは`.env`ファイルに保存（Gitにコミットしない）
- `.gitignore`に`.env`が含まれていることを確認
- APIキーを共有しない
- 定期的にAPIキーを更新

---

**何か問題が発生した場合は、ログファイルを確認してください：**
```bash
# APIサーバーのログ
tail -f /Users/tasuku/Projects/RealworldAgent/services/api-server/logs/error.log
```

