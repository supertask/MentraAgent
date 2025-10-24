# 完全版ガイド - Realworld Agent

## 🎉 完全版で追加された機能

### 1. 📂 写真保存機能
- **ローカルストレージ**: `services/api-server/storage/photos/` に保存
- **セッション別**: 各セッションごとにディレクトリ分割
- **メタデータ**: JSON形式で保存（.meta.json）
- **データベース**: PostgreSQLに記録情報を保存

### 2. 📝 強化されたログシステム
- **ファイル出力**: `services/api-server/logs/` に保存
  - `combined.log`: 全ログ（最大10MB×5ファイル）
  - `error.log`: エラーのみ
  - `access.log`: アクセスログ
- **構造化ログ**: JSON形式で詳細記録
- **自動ローテーション**: サイズ制限で自動分割

### 3. 💾 データベース連携
- **セッション管理**: 作成・取得・更新・削除
- **写真記録**: 保存情報をDB管理
- **文字起こし**: 記録と検索機能

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
│   └── files/                 # その他ファイル
└── prisma/
    └── dev.db                 # SQLiteファイル（開発時）
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

## 📈 次のステップ

### Modal統合（GPU処理）

現在、以下の機能は**未実装**です：

1. **高精度文字起こし（WhisperX）**
   - ブラウザのWeb Speech APIのみ使用中
   - Modalで WhisperX を使えば精度向上

2. **話者分離（pyannote）**
   - 誰が話したかの識別は未実装

3. **画像認識（Claude Vision）**
   - 写真の内容分析は未実装

4. **仕様書自動生成**
   - スタブのみ（実際の生成は未実装）

### Modal統合手順

1. **Modal API Keyの設定**
   ```bash
   # .envファイルに追加
   MODAL_TOKEN_ID=your_token_id
   MODAL_TOKEN_SECRET=your_token_secret
   MODAL_API_URL=your_modal_endpoint
   ```

2. **GPUサーバーのデプロイ**
   ```bash
   bun run modal:deploy
   ```

3. **APIサーバーにModal統合コード追加**
   - `services/api-server/src/integrations/modal.ts`
   - processing.tsルーターの完全実装

## 💰 コスト管理

### 現在の費用: $0/月

- ✅ ブラウザAPI: 無料
- ✅ ローカルストレージ: 無料
- ✅ PostgreSQL（Docker）: 無料
- ❌ Modal: 未使用

### Modal使用時の概算費用

- WhisperX処理: $0.04/時間
- 画像分析: $0.10/時間
- 合計: **$0.25-0.45/時間**

月間40時間使用: **$10-18/月**

## 📚 API エンドポイント

### 実装済み

- `POST /api/device/photo` - 写真アップロード ✅
- `GET /api/device/info` - デバイス情報 ✅
- `POST /api/session` - セッション作成 ✅
- `GET /api/session/:sessionId` - セッション取得 ✅
- `PATCH /api/session/:sessionId` - セッション更新 ✅
- `DELETE /api/session/:sessionId` - セッション終了 ✅
- `GET /api/session?userId=XXX` - セッション一覧 ✅

### 未実装

- `POST /api/processing/transcribe` - GPU文字起こし ⏳
- `POST /api/processing/analyze-image` - GPU画像分析 ⏳
- `POST /api/processing/generate-spec` - 仕様書生成 ⏳

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

