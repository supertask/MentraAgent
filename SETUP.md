# Realworld Agent - セットアップガイド

このガイドでは、Realworld Agentシステムを最初から構築する手順を説明します。

## 📋 前提条件

### 必須
- **Bun**: v1.1.0以上 ([インストール](https://bun.sh/))
- **Node.js**: v20.0.0以上（オプション）
- **Docker**: v20.10以上
- **Python**: 3.11以上（Modal用）
- **Git**: 最新版

### アカウント登録

以下のサービスにアカウント登録が必要です：

1. **MentraOS** (Mentra Glassを使用する場合)
   - https://console.mentra.glass/
   - API Keyを取得

2. **Modal** (GPUサーバー)
   - https://modal.com/
   - アカウント作成後、トークン取得

3. **OpenAI** (GPT-4V等)
   - https://platform.openai.com/
   - API Key取得

4. **Anthropic** (Claude 3.5 Sonnet等)
   - https://console.anthropic.com/
   - API Key取得

5. **Slack** (通知用、オプション)
   - https://api.slack.com/
   - Webhook URL取得

6. **GitHub** (PR作成用、オプション)
   - https://github.com/settings/tokens
   - Personal Access Token取得

7. **Notion** (ドキュメント保存用、オプション)
   - https://www.notion.so/my-integrations
   - Integration作成

## 🚀 セットアップ手順

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/your-username/MentraAgent.git
cd MentraAgent
```

### Step 2: 依存関係のインストール

```bash
# Bunで全依存関係をインストール
bun install

# または npm
npm install
```

### Step 3: 環境変数の設定

環境変数ファイルを作成：

```bash
# テンプレートをコピー（手動で .env.template の内容をコピー）
cat > .env << 'EOF'
# デバイス設定
INPUT_DEVICE=webcam

# MentraOS（Mentra Glassを使用する場合のみ）
MENTRAOS_API_KEY=your_api_key_here
MENTRAOS_PACKAGE_NAME=com.example.realworld-agent

# APIサーバー
API_SERVER_PORT=3000
API_SERVER_HOST=0.0.0.0

# データベース
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/realworld_agent

# Modal
MODAL_TOKEN_ID=your_modal_token_id
MODAL_TOKEN_SECRET=your_modal_token_secret

# AI Provider
AI_PROVIDER=modal
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Vector DB
VECTOR_DB_PROVIDER=qdrant
QDRANT_URL=http://localhost:6333

# 外部サービス（オプション）
SLACK_WEBHOOK_URL=your_slack_webhook
GITHUB_TOKEN=your_github_token
NOTION_API_KEY=your_notion_key

# 処理設定
TRANSCRIPTION_LANGUAGE=ja
ENABLE_SPEAKER_DIARIZATION=true
IMPORTANCE_THRESHOLD=0.7
AUTO_CAPTURE_ENABLED=true
EOF
```

各API Keyを実際の値に置き換えてください。

### Step 4: Dockerサービスの起動

```bash
# PostgreSQL、Qdrant、Redisを起動
bun run docker:up

# 起動確認
docker ps
```

### Step 5: データベースのセットアップ

```bash
# Prismaクライアント生成
cd services/api-server
bun run db:generate

# マイグレーション実行
bun run db:migrate

# ルートディレクトリに戻る
cd ../..
```

### Step 6: Modalのセットアップ

```bash
# Python環境のセットアップ（推奨: venv）
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Modal CLIのインストール
pip install modal

# Modalにログイン
modal token new

# Modalシークレットの設定
modal secret create realworld-agent-secrets \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  HUGGINGFACE_TOKEN=your_huggingface_token_if_needed

# GPUサーバーをデプロイ
cd services/gpu-server
modal deploy modal_app.py

# デプロイ後、表示されるURLを .env の MODAL_API_URL に設定
```

### Step 7: アプリケーションの起動

#### Webカメラモードの場合

```bash
# ターミナル1: APIサーバー
bun run dev:api

# ターミナル2: Webクライアント
bun run dev:web
```

ブラウザで `http://localhost:5173` を開く

#### MentraOSモードの場合

```bash
# .envでINPUT_DEVICEをmentraに変更
INPUT_DEVICE=mentra

# MentraOSアプリを起動
bun run dev:mentra

# MentraOS Developer Consoleでアプリを有効化
# https://console.mentra.glass/
```

## 🧪 動作確認

### 1. APIサーバーのヘルスチェック

```bash
curl http://localhost:3000/health
```

期待される出力:
```json
{
  "status": "ok",
  "services": {
    "database": true,
    "redis": true
  }
}
```

### 2. Modal GPUサーバーのヘルスチェック

```bash
curl https://your-username--realworld-agent-api.modal.run/health
```

### 3. Webクライアントの動作確認

1. ブラウザで `http://localhost:5173` を開く
2. 「開始」ボタンをクリック
3. カメラとマイクの許可を与える
4. 何か話してみる → 文字起こしが表示される
5. 「写真を撮影」ボタンをクリック → 写真が保存される

## 🐛 トラブルシューティング

### データベース接続エラー

```bash
# Dockerコンテナの確認
docker ps

# PostgreSQLログの確認
docker logs realworld-agent-db

# 再起動
bun run docker:down
bun run docker:up
```

### Modal デプロイエラー

```bash
# Modalログインの確認
modal token set --token-id xxx --token-secret yyy

# デプロイログの確認
modal deploy modal_app.py --stream-logs
```

### Webクライアントでカメラ・マイクにアクセスできない

- **HTTPS**: ブラウザによってはHTTPSが必要（開発時はlocalhostは例外）
- **権限**: ブラウザの設定でカメラ・マイクの権限を確認
- **デバイス**: 他のアプリケーションがカメラ・マイクを使用していないか確認

### MentraOS接続エラー

- **API Key**: 正しいAPI Keyが設定されているか確認
- **Package Name**: Developer Consoleで登録したPackage Nameと一致するか確認
- **ネットワーク**: MentraOS Cloudへの接続が可能か確認

## 📚 次のステップ

セットアップ完了後：

1. **カスタマイズ**
   - `services/api-server/src/config.ts` で設定をカスタマイズ
   - 重要キーワードの追加・変更
   - 自動撮影の閾値調整

2. **外部連携の設定**
   - Slack通知の設定
   - GitHub PR自動作成の設定
   - Notion統合の設定

3. **RAGシステムの構築**
   - 社内ドキュメントのインデックス化
   - コードベースの登録

4. **本番デプロイ**
   - Supabase等のマネージドPostgreSQLに移行
   - Modalを本番環境にデプロイ
   - APIサーバーをクラウドにデプロイ

## 📖 ドキュメント

- [アーキテクチャ詳細](./docs/architecture.md)
- [API仕様書](./docs/api-spec.md)
- [MentraOS開発ガイド](./docs/mentra_developer_tips.md)

## 💬 サポート

問題が発生した場合：

- GitHub Issues: [Issues](https://github.com/your-username/MentraAgent/issues)
- Discord: [Discord Community](https://discord.gg/mentra)

