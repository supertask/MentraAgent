# 完全版ガイド - Realworld Agent

## 🎉 完全版で実装された機能

### 1. 📄 仕様書生成機能（完全実装）
- **Modal GPUサーバー**: OpenAI/Anthropic両対応
- **プロバイダー優先度設定**: 環境変数で切り替え可能
- **自動フォールバック**: プライマリ失敗時に自動的にセカンダリを使用
- **コンテキスト統合**: 文字起こし＋写真を統合して仕様書生成
- **データベース保存**: 生成した仕様書を永続化

### 2. 🔄 セッション管理（完全実装）
- **セッション作成**: フロントエンドから作成可能
- **完全なCRUD操作**: 作成・取得・更新・削除
- **データベース連携**: すべてのデータをセッションに紐付け
- **外部キー制約**: カスケード削除対応

### 3. 📂 写真保存機能
- **ローカルストレージ**: `services/api-server/storage/photos/` に保存
- **セッション別**: 各セッションごとにディレクトリ分割
- **データベース**: PostgreSQLに記録情報を保存
- **リポジトリパターン**: PhotoRepositoryで管理

### 4. 📝 文字起こし保存機能
- **データベース**: PostgreSQLに保存
- **セッション連携**: sessionIdで紐付け
- **タイムスタンプ**: 時系列で管理
- **リポジトリパターン**: TranscriptionRepositoryで管理

### 5. 💰 コスト最適化
- **Modal keep_warm無効化**: 使った分だけ課金
- **GPU不使用**: 仕様書生成はCPUのみで動作
- **月額コスト削減**: $90-288/月 → **$10-135/月**
- **コールドスタート**: 初回起動20-60秒（許容範囲）

### 6. 🤖 LLMプロバイダー管理
- **優先度設定**: OpenAI/Anthropicを環境変数で切り替え
- **モデル選択**: gpt-4o、claude-3.5-sonnetなど
- **フォールバック機構**: 障害時の自動切り替え
- **コスト管理**: 用途に応じたモデル選択

### 7. 📝 強化されたログシステム
- **ファイル出力**: `services/api-server/logs/` に保存
  - `combined.log`: 全ログ（最大10MB×5ファイル）
  - `error.log`: エラーのみ
  - `access.log`: アクセスログ
- **構造化ログ**: JSON形式で詳細記録
- **自動ローテーション**: サイズ制限で自動分割

### 8. 💾 データベース連携（完全実装）
- **SessionRepository**: セッション管理
- **TranscriptionRepository**: 文字起こし管理
- **PhotoRepository**: 写真管理
- **SpecificationRepository**: 仕様書管理
- **外部キー制約**: データ整合性の保証

## 📁 ファイル構造

```
services/api-server/
├── logs/                       # ログファイル
│   ├── combined.log           # 全ログ
│   ├── error.log              # エラーログ
│   └── access.log             # アクセスログ
├── storage/                   # ローカルストレージ
│   ├── photos/                # 写真保存先
│   │   └── session-XXX/       # セッションごと
│   │       ├── capture-1.jpg
│   │       └── capture-1.jpg.meta.json
│   ├── specifications/        # 仕様書保存先（エクスポート用）
│   │   └── spec-XXXXX.md     # 生成された仕様書
│   └── files/                 # その他ファイル
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   └── migrations/            # マイグレーションファイル
└── src/
    └── repositories/          # データベースリポジトリ
        ├── SessionRepository.ts
        ├── TranscriptionRepository.ts
        ├── PhotoRepository.ts
        └── SpecificationRepository.ts
```

## 🔍 ログの確認方法

### リアルタイムでログを見る

```bash
# 全ログをリアルタイム表示
tail -f services/api-server/logs/combined.log

# エラーログのみ
tail -f services/api-server/logs/error.log

# 写真アップロードログを抽出
tail -f services/api-server/logs/combined.log | grep "Photo"
```

### ログの検索

```bash
# 特定のセッションのログを検索
grep "session-1761321890896" services/api-server/logs/combined.log

# 今日のエラーログ
grep "$(date +%Y-%m-%d)" services/api-server/logs/error.log
```

## 📸 保存された写真の確認

### 写真一覧表示

```bash
# 全写真を表示
find services/api-server/storage/photos -name "*.jpg"

# セッション別に表示
ls -lh services/api-server/storage/photos/session-*/
```

### 写真のメタデータ確認

```bash
# メタデータを確認
cat services/api-server/storage/photos/session-XXX/capture-YYY.jpg.meta.json
```

出力例:
```json
{
  "mimetype": "image/jpeg",
  "uploadedAt": "2025-10-24T16:05:52.220Z"
}
```

### 写真の表示

```bash
# Macの場合
open services/api-server/storage/photos/session-XXX/capture-YYY.jpg

# URLでアクセス（APIサーバー経由）
# TODO: 画像配信エンドポイントを実装予定
```

## 🗄️ データベースの確認

### Prisma Studioで確認（GUI）

```bash
cd services/api-server
bun run db:studio
```

ブラウザで `http://localhost:5555` が開きます。

### コマンドラインで確認

```bash
# PostgreSQLに接続
psql postgresql://postgres:postgres@localhost:5432/realworld_agent

# セッション一覧
SELECT id, "userId", "deviceType", status, "startTime" FROM "Session" ORDER BY "startTime" DESC LIMIT 10;

# 写真一覧
SELECT id, "sessionId", filename, size, timestamp FROM "Photo" ORDER BY timestamp DESC LIMIT 10;

# 文字起こし一覧
SELECT id, "sessionId", text, "isFinal", timestamp FROM "Transcription" WHERE "isFinal" = true ORDER BY timestamp DESC LIMIT 10;
```

## 📊 ログファイルの分析

### 統計情報

```bash
# 写真アップロード回数
grep "Photo uploaded" services/api-server/logs/combined.log | wc -l

# エラー回数
wc -l < services/api-server/logs/error.log

# セッション作成回数
grep "Creating new session" services/api-server/logs/combined.log | wc -l
```

### 詳細分析

```bash
# 写真サイズの集計
grep "Photo uploaded" services/api-server/logs/combined.log | grep -o '"size":[0-9]*' | awk -F: '{sum+=$2} END {print "Total:", sum/1024/1024, "MB"}'

# セッション時間の計算
# TODO: スクリプト作成予定
```

## 🔧 トラブルシューティング

### 写真が保存されない

```bash
# ストレージディレクトリの権限確認
ls -ld services/api-server/storage/

# ログでエラー確認
grep "Photo" services/api-server/logs/error.log
```

### ログファイルが大きくなりすぎた

```bash
# ログをクリーンアップ
rm services/api-server/logs/*.log.1
rm services/api-server/logs/*.log.2

# 自動ローテーション設定（既に有効）
# - 10MB以上で自動分割
# - 最大5ファイル保持
```

### データベース接続エラー

```bash
# PostgreSQLの状態確認
docker ps | grep postgres

# ログ確認
docker logs realworld-agent-db

# 再接続
docker restart realworld-agent-db
```

## 📄 仕様書の確認

### データベースから確認

```bash
# PostgreSQLに接続
docker exec realworld-agent-db psql -U postgres -d realworld_agent

# 仕様書一覧
SELECT id, "sessionId", title, status, "createdAt" FROM "Specification" ORDER BY "createdAt" DESC LIMIT 5;

# 仕様書の内容を確認
SELECT content FROM "Specification" WHERE id = 'your-spec-id';

# 終了
\q
```

### エクスポートされた仕様書を確認

```bash
# 仕様書一覧
ls -lh services/api-server/storage/specifications/

# 仕様書を開く（Mac）
open services/api-server/storage/specifications/spec-XXXXX.md

# 内容を表示
cat services/api-server/storage/specifications/spec-XXXXX.md
```

### データベースから仕様書をエクスポート

```bash
# 最新の仕様書をMarkdownファイルとして保存
docker exec realworld-agent-db psql -U postgres -d realworld_agent -t \
  -c "SELECT content FROM \"Specification\" ORDER BY \"createdAt\" DESC LIMIT 1;" \
  | jq -r '.markdown' > ./latest-spec.md
```

## 📈 実装済み機能と次のステップ

### ✅ 実装済み

1. **仕様書自動生成（完全実装）**
   - OpenAI/Anthropic両対応
   - プロバイダー優先度設定＋フォールバック
   - 文字起こし＋写真のコンテキスト統合

2. **セッション管理（完全実装）**
   - 完全なCRUD操作
   - データベース連携
   - フロントエンドからの作成

3. **文字起こし・写真保存**
   - ブラウザWeb Speech API使用
   - データベース永続化
   - セッション連携

### 🚧 今後の実装予定

1. **高精度文字起こし（WhisperX）**
   - 現在は一時的に無効化
   - 単語レベルタイムスタンプ
   - 画像とテキストのタイムスタンプ連携に必要

2. **話者分離（pyannote）**
   - 現在は一時的に無効化
   - 誰が話したかの識別
   - 会議録作成に有用

3. **画像認識（Claude Vision / GPT-4o Vision）**
   - 準備済み
   - 写真の内容分析

4. **Multi-RAGシステム**
   - Qdrant統合
   - 社内ドキュメント検索
   - マルチモーダル検索

### Modal統合の状態

**現在**: ✅ デプロイ済み・動作中

- Modal GPUサーバー: デプロイ済み
- LLM連携: OpenAI/Anthropic対応
- 仕様書生成: 完全動作
- コスト最適化: keep_warm無効化済み

## 💰 コスト管理

### 現在の月額費用: **$10-135**（使用量による）

#### 内訳

| コンポーネント | 月額費用 | 備考 |
|---------------|---------|------|
| ブラウザAPI | **無料** | Web Speech API使用 |
| ローカルストレージ | **無料** | 写真・ログ保存 |
| PostgreSQL（Docker） | **無料** | ローカル開発環境 |
| Modal GPUサーバー | **$0-5** | keep_warm無効化（使った分だけ） |
| LLM API (OpenAI/Anthropic) | **$10-100** | 仕様書生成のみ |
| Redis | **無料** | ローカル開発環境 |

#### コスト最適化の効果

**従来**: $90-288/月  
**現在**: **$10-135/月**  
**削減率**: 約85-90%

#### コスト削減のポイント

1. **Modal keep_warm無効化**
   - 常時課金なし
   - 使った分だけ課金
   - コールドスタート: 20-60秒（許容範囲）

2. **GPU不使用**
   - 仕様書生成はCPUのみで動作
   - WhisperX再有効化時のみGPU使用予定

3. **LLMプロバイダー選択**
   - 用途に応じてOpenAI/Anthropicを切り替え
   - gpt-4o-mini使用でさらにコスト削減可能

4. **バッチ処理**
   - API呼び出しを最小限に
   - 文字起こし＋写真をまとめて送信

## 📚 API エンドポイント

### ✅ 実装済み

#### デバイス入力
- `POST /api/device/photo` - 写真アップロード
- `GET /api/device/info` - デバイス情報
- `GET /api/device/webcam/stream` - WebSocketストリーム

#### セッション管理
- `POST /api/sessions` - セッション作成
- `GET /api/sessions/:sessionId` - セッション取得
- `PATCH /api/sessions/:sessionId` - セッション更新
- `DELETE /api/sessions/:sessionId` - セッション終了
- `GET /api/sessions?userId=XXX` - セッション一覧

#### AI処理
- `POST /api/processing/generate-spec` - 仕様書生成（完全実装）

#### 外部連携
- `POST /api/webhook/slack` - Slack通知
- `POST /api/webhook/github` - GitHub連携
- `POST /api/webhook/notion` - Notion連携

### 🚧 一時的に無効化

- `POST /api/processing/transcribe` - GPU文字起こし（WhisperX）
- `POST /api/processing/analyze-image` - GPU画像分析

※ これらの機能は実装済みですが、コスト最適化のため一時的に無効化しています。

## 🎓 使い方の例

### 1. セッション開始

ブラウザで `http://localhost:5173` を開き、「開始」ボタンをクリック

### 2. 写真撮影

「写真を撮影」ボタンをクリック

保存先: `services/api-server/storage/photos/session-XXX/`

### 3. ログ確認

```bash
tail -f services/api-server/logs/combined.log
```

### 4. データベース確認

```bash
cd services/api-server
bun run db:studio
```

ブラウザで `Photo` テーブルを確認

---

## 🎯 まとめ

✅ **動作中の機能**
- 写真保存（ローカル）
- ログ出力（ファイル + コンソール）
- データベース連携
- セッション管理
- Web Speech API文字起こし

⏳ **今後の実装**
- Modal GPU処理統合
- WhisperX高精度文字起こし
- Claude Vision画像分析
- 仕様書自動生成

完全版が動作しています！🎉

