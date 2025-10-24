# Realworld Agent System

Mentra GlassまたはWebカメラからのリアルタイム音声・映像を処理し、会議や現場作業から自動的に仕様書やコードを生成するマルチモーダルAIエージェントシステム

## 🎯 概要

このシステムは、リアルワールドの音声と映像をリアルタイムで分析し、以下を自動生成します：

- 📝 **議事録・要約**: 複数話者の会話を自動で文字起こし・要約
- 📄 **仕様書**: 会議内容から技術仕様書を自動生成
- 💻 **コード**: 音声からの意図検出で自動コード生成とGitHub PR作成 🆕
- 📊 **ドキュメント**: Notionへの自動ドキュメント化
- 🔔 **通知**: Slackへの自動通知と共有

## 🏗️ アーキテクチャ

```
[入力デバイス]
  - Mentra Glass (MentraOS経由)
  - Webカメラ (ブラウザ経由)
        ↓
[アプリケーションサーバー] (Bun/TypeScript)
  - MentraOSアプリ
  - Webカメラ入力受信
  - コンテキスト管理
  - 重要箇所検出
        ↓
[GPUサーバー] (Modal/Python)
  - WhisperX (高精度文字起こし)
  - pyannote (話者分離)
  - Vision LLM (画像認識)
  - Multi-RAG (マルチモーダル統合)
  - LLM (仕様書・コード生成)
        ↓
[外部連携]
  - Slack (通知)
  - GitHub (PR作成)
  - Notion (ドキュメント保存)
```

## 🚀 クイックスタート

### 前提条件

- **Bun**: v1.1.0以上
- **Node.js**: v20.0.0以上（オプション）
- **Python**: 3.11以上（GPU処理用）
- **Docker**: v20.10以上（PostgreSQL用）
- **Modal CLI**: GPUサーバーデプロイ用

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/realworld-agent.git
cd realworld-agent
```

### 2. 依存関係のインストール

```bash
# Bunを使用（推奨）
bun install

# またはnpm
npm install
```

### 3. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集して必要な設定を追加
vim .env
```

### 4. データベースの起動

```bash
# Docker Composeでサービスを起動
bun run docker:up

# データベースマイグレーション
bun run db:migrate
```

### 5. Modal環境のセットアップ

```bash
# Modal CLIのインストール
pip install modal

# Modalにログイン
modal token new

# Modal環境変数の設定
modal secret create realworld-agent-secrets \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Modalアプリのデプロイ
bun run modal:deploy
```

### 6. アプリケーションの起動

#### Webカメラモード

```bash
# APIサーバーを起動
bun run dev:api

# 別のターミナルでWebクライアントを起動
bun run dev:web
```

ブラウザで以下のURLを開く：
- `http://localhost:5173` - トップページ
- `http://localhost:5173/webcam.html` - Webカメラ機能
- `http://localhost:5173/generated.html` - 生成履歴

#### MentraOSモード

```bash
# MentraOSアプリを起動
bun run dev:mentra
```

MentraOS Developer Consoleでアプリを有効化

## 📁 プロジェクト構成

```
realworld-agent/
├── apps/
│   ├── web-client/          # Webカメラ入力用フロントエンド
│   └── mentra-app/          # MentraOSアプリ
├── services/
│   ├── api-server/          # 統合APIサーバー
│   └── gpu-server/          # Modal GPUサーバー
├── packages/
│   └── shared/              # 共通型定義
├── docs/                    # ドキュメント
├── docker-compose.yml       # Docker設定
├── .env.example             # 環境変数テンプレート
└── package.json             # Monorepo設定
```

## 🔧 開発

### 開発サーバーの起動

```bash
# すべてのサービスを同時起動
bun run dev

# 個別起動
bun run dev:api      # APIサーバー
bun run dev:web      # Webクライアント
bun run dev:mentra   # MentraOSアプリ
```

### ビルド

```bash
# すべてビルド
bun run build

# 個別ビルド
bun run build:apps
bun run build:services
```

### データベース

```bash
# マイグレーション
bun run db:migrate

# Prisma Studio（GUI）
bun run db:studio
```

### Modal GPUサーバー

```bash
# 開発モード（ホットリロード）
bun run modal:dev

# 本番デプロイ
bun run modal:deploy
```

## 🎛️ 設定

### 入力デバイスの切り替え

`.env`ファイルで設定：

```env
# Webカメラを使用
INPUT_DEVICE=webcam

# Mentra Glassを使用
INPUT_DEVICE=mentra
```

### AIプロバイダーの切り替え

```env
# Modal（推奨）
AI_PROVIDER=modal

# その他のプロバイダー
AI_PROVIDER=replicate
AI_PROVIDER=runpod
```

### LLMプロバイダーの優先度設定

OpenAIとAnthropicのどちらを優先するか設定できます：

```env
# OpenAIを優先（デフォルト）
PRIMARY_LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o

# Anthropicを優先
PRIMARY_LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# フォールバック機能の有効化（推奨）
# プライマリが失敗した場合、自動的にセカンダリを使用
ENABLE_LLM_FALLBACK=true
```

**使用例**：
- OpenAIの$50クレジットを消化したい → `PRIMARY_LLM_PROVIDER=openai`
- 高精度な分析が必要 → `PRIMARY_LLM_PROVIDER=anthropic`
- 安定性重視 → `ENABLE_LLM_FALLBACK=true`（両方設定）

## 💰 コスト概算

**月間使用想定**: 1日2時間 × 20営業日 = 40時間

| コンポーネント | 月額費用 | 備考 |
|---------------|---------|------|
| Modal GPU処理 | **$0-5** | keep_warm無効化（使った分だけ課金） |
| LLM API (OpenAI/Anthropic) | $10-100 | 仕様書生成のみ使用 |
| PostgreSQL/Storage | $0-30 | ローカル開発は無料 |
| **合計** | **$10-135** | **コスト最適化済み** ✅ |

**コスト削減のポイント**:
- ✅ Modal `keep_warm`無効化 → 常時課金なし
- ✅ GPU不使用 → 仕様書生成はCPUのみ
- ✅ 使用時のみ課金 → 待機コスト$0
- ✅ LLMプロバイダー切り替え → 安価なモデルも選択可能

## 🎯 新機能: コード自動生成

音声から「Pythonでファイル読み込みプログラムを生成してください」と言うだけで、完全なコードを自動生成します！

**特徴**:
- 🎤 音声からの意図自動検出
- 💻 複数ファイル・複数言語対応
- 🔄 GitHub PR自動作成
- 📝 仕様書コンテキストの統合

詳細は [コード生成ガイド](./docs/CODE_GENERATION_GUIDE.md) を参照

## 📚 ドキュメント

- [**コード生成ガイド**](./docs/CODE_GENERATION_GUIDE.md) - 音声からのコード自動生成 🆕
- [LLMプロバイダー設定](./docs/LLM_PROVIDER_CONFIGURATION.md) - OpenAI/Anthropic切り替え
- [MentraOS開発ガイド](./docs/mentra_developer_tips.md)
- [アーキテクチャ詳細](./docs/architecture.md)（作成予定）
- [API仕様書](./docs/api-spec.md)（作成予定）

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずIssueで議論してください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)を参照

## 🔗 リンク

- [MentraOS Documentation](https://docs.mentraglass.com/)
- [Modal Documentation](https://modal.com/docs)
- [Developer Console](https://console.mentra.glass/)

## 📧 サポート

質問や問題がある場合：

- GitHub Issues: [Issues](https://github.com/your-username/realworld-agent/issues)
- Discord: [Discord Community](https://discord.gg/mentra)

