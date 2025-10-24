# クイックスタート（5分で動かす）

最小限の設定でWebカメラモードを起動する手順です。

## 1. 依存関係のインストール

```bash
bun install
```

## 2. Dockerサービスの起動

```bash
bun run docker:up
```

## 3. 環境変数の設定（最小限）

`.env` ファイルを作成：

```bash
cat > .env << 'EOF'
INPUT_DEVICE=webcam
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/realworld_agent
API_SERVER_PORT=3000
QDRANT_URL=http://localhost:6333

# LLM設定（OpenAI優先）
PRIMARY_LLM_PROVIDER=openai
ENABLE_LLM_FALLBACK=true
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
EOF
```

**重要**: 
- `OPENAI_API_KEY` を実際のキーに置き換えてください（必須）
- `ANTHROPIC_API_KEY` はフォールバック用にも設定可能です（オプション）
- `PRIMARY_LLM_PROVIDER=openai` でOpenAIが優先されます

## 4. データベースのセットアップ

```bash
cd services/api-server
bun run db:generate
bun run db:migrate
cd ../..
```

## 5. アプリケーションの起動

```bash
# ターミナル1: APIサーバー
bun run dev:api

# ターミナル2（新しいターミナル）: Webクライアント
bun run dev:web
```

## 6. ブラウザで開く

http://localhost:5173

「開始」ボタンをクリックして、カメラとマイクの許可を与えます。

## 🎉 完了！

これで基本的な動作確認ができます。

**制限事項**（この最小構成では）:
- GPUサーバー（Modal）なし → 高度なAI処理は動作しません
- 外部連携なし → Slack/GitHub/Notion統合なし

完全な機能を使用するには、[SETUP.md](./SETUP.md) を参照してください。

