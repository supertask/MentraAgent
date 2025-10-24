# OpenAI優先設定 - クイックガイド

このガイドでは、OpenAIを優先的に使用してAnthropicをフォールバックとして設定する方法を説明します。

## 🎯 目的

- OpenAIの$50クレジットを優先的に消化する
- OpenAIがエラーの場合のみAnthropicを使用する
- 安定した運用を実現する

## ⚡ クイック設定

### 1. 環境変数ファイル（`.env`）

以下の設定を `.env` ファイルに追加してください：

```env
# ========================================
# LLMプロバイダー設定（OpenAI優先）
# ========================================

# プライマリLLM: OpenAI
PRIMARY_LLM_PROVIDER=openai

# フォールバック有効化
ENABLE_LLM_FALLBACK=true

# OpenAI設定（必須）
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o

# Anthropic設定（フォールバック用）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# ========================================
# その他の必須設定
# ========================================

INPUT_DEVICE=webcam
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/realworld_agent
API_SERVER_PORT=3000
QDRANT_URL=http://localhost:6333
```

### 2. Modalシークレットの設定

Modalでも同じ設定を行います：

```bash
# Modalにログイン（初回のみ）
modal token new

# シークレットの作成
modal secret create realworld-agent-secrets \
  PRIMARY_LLM_PROVIDER=openai \
  ENABLE_LLM_FALLBACK=true \
  OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  OPENAI_MODEL=gpt-4o \
  ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 3. GPUサーバーのデプロイ

設定が完了したら、GPUサーバーをデプロイします：

```bash
cd services/gpu-server
modal deploy modal_app.py
```

## ✅ 動作確認

### 設定の確認

デプロイ後、ログで設定を確認できます：

```bash
modal logs realworld-agent
```

正常に動作している場合、以下のようなログが表示されます：

```
🖼️ 画像分析開始（プライマリ: openai）
  🤖 OpenAI (gpt-4o)で画像分析中...
✅ 画像分析完了

📄 仕様書生成開始（プライマリ: openai）
  🤖 OpenAI (gpt-4o)でテキスト生成中...
✅ 仕様書生成完了
```

### フォールバックのテスト

フォールバックが正しく動作するかテストできます：

```bash
# 一時的にOpenAI APIキーを無効化してテスト
modal secret create realworld-agent-secrets \
  PRIMARY_LLM_PROVIDER=openai \
  ENABLE_LLM_FALLBACK=true \
  OPENAI_API_KEY=invalid_key_for_test \
  ANTHROPIC_API_KEY=your_actual_anthropic_key
```

フォールバックが動作する場合、以下のログが表示されます：

```
⚠️ プライマリLLM（openai）エラー: Invalid API key
🔄 フォールバック: anthropicで再試行
  🤖 Anthropic (claude-3-5-sonnet-20241022)で画像分析中...
✅ 画像分析完了
```

## 📊 使用状況の監視

### OpenAIの使用状況確認

OpenAI Dashboardで使用量を確認できます：

1. https://platform.openai.com/usage にアクセス
2. API使用量とコストを確認
3. $50クレジットの残高を確認

### Anthropicの使用状況確認

Anthropic Consoleで使用量を確認できます：

1. https://console.anthropic.com/ にアクセス
2. Usageタブで使用量を確認
3. フォールバックでどのくらい使用されているか確認

## 💡 運用のヒント

### 1. OpenAIクレジット消化期間

OpenAIの$50クレジットを使い切るまでこの設定で運用します：

```env
PRIMARY_LLM_PROVIDER=openai
ENABLE_LLM_FALLBACK=true
```

### 2. OpenAIクレジット使い切り後

OpenAIの$50を使い切った後は、Anthropicに切り替えます：

```env
PRIMARY_LLM_PROVIDER=anthropic
ENABLE_LLM_FALLBACK=false
```

または両方のAPIキーを設定して継続利用する場合：

```env
PRIMARY_LLM_PROVIDER=anthropic
ENABLE_LLM_FALLBACK=true
OPENAI_API_KEY=your_new_paid_key  # 有料プランに移行
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. コスト最適化

より安価なモデルに切り替えることも可能です：

```env
# OpenAI miniモデルでコスト削減
PRIMARY_LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini  # 標準のgpt-4oより安価
```

## 🔄 設定変更の反映

### ローカル開発環境

`.env` ファイルを変更した後、サーバーを再起動：

```bash
# APIサーバーを再起動（Ctrl+Cで停止後）
bun run dev:api
```

### Modal環境

Modalシークレットを変更した後、再デプロイ：

```bash
# 1. シークレットを削除
modal secret delete realworld-agent-secrets

# 2. 新しいシークレットを作成
modal secret create realworld-agent-secrets \
  PRIMARY_LLM_PROVIDER=anthropic \
  # ... 他の設定

# 3. 再デプロイ
cd services/gpu-server
modal deploy modal_app.py
```

## 🆘 トラブルシューティング

### 問題: OpenAIが使われない

**確認事項**：
1. `PRIMARY_LLM_PROVIDER=openai` が設定されているか
2. OpenAI APIキーが正しいか
3. APIキーに十分なクレジットがあるか

**解決策**：
```bash
# 設定を確認
cat .env | grep PRIMARY_LLM_PROVIDER
cat .env | grep OPENAI_API_KEY

# Modalシークレットを確認
modal secret list
```

### 問題: フォールバックが動作しない

**確認事項**：
1. `ENABLE_LLM_FALLBACK=true` が設定されているか
2. Anthropic APIキーが設定されているか

**解決策**：
```bash
# 設定を確認
cat .env | grep ENABLE_LLM_FALLBACK
cat .env | grep ANTHROPIC_API_KEY
```

### 問題: エラーメッセージ「未サポートのプロバイダー」

**原因**：
`PRIMARY_LLM_PROVIDER` の値が `openai` または `anthropic` ではない

**解決策**：
```bash
# 正しい値を設定
PRIMARY_LLM_PROVIDER=openai  # または anthropic
```

## 📈 期待されるコスト

### OpenAI優先設定での月間コスト目安

**使用想定**: 1日2時間 × 20営業日 = 40時間

| 項目 | 月間使用量（目安） | コスト |
|-----|-----------------|--------|
| GPT-4o テキスト生成 | ~2M トークン | $10-20 |
| GPT-4o Vision | ~500 画像 | $5-10 |
| フォールバック（Anthropic） | ~10% | $2-5 |
| **合計** | - | **$17-35** |

OpenAIの$50クレジットで約1.5〜3ヶ月利用可能です。

## 📚 関連ドキュメント

- [詳細なLLM設定ガイド](./LLM_PROVIDER_CONFIGURATION.md)
- [セットアップガイド](../SETUP.md)
- [クイックスタート](../QUICKSTART_JA.md)

## 🔗 参考リンク

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Modal Documentation](https://modal.com/docs)

