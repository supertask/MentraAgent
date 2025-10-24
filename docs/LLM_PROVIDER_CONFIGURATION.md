# LLMプロバイダー設定ガイド

このガイドでは、OpenAIとAnthropicのLLMプロバイダーを切り替える方法を説明します。

## 📋 概要

Realworld AgentはOpenAI（GPT-4）とAnthropic（Claude 3.5 Sonnet）の両方をサポートしており、プライマリLLMプロバイダーを環境変数で切り替えることができます。

### 対応機能

以下の機能でLLMプロバイダーが切り替わります：

1. **画像分析** (`analyze_image`)
   - OpenAI: GPT-4o Vision
   - Anthropic: Claude 3.5 Sonnet Vision

2. **仕様書生成** (`generate_specification`)
   - OpenAI: GPT-4o
   - Anthropic: Claude 3.5 Sonnet

3. **その他のテキスト生成タスク**
   - 両プロバイダーをサポート

## 🔧 設定方法

### 1. 環境変数の設定

`.env` ファイルに以下を追加：

```env
# プライマリLLMプロバイダー
PRIMARY_LLM_PROVIDER=openai  # または anthropic

# フォールバック機能
ENABLE_LLM_FALLBACK=true

# OpenAI設定
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Anthropic設定
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 2. Modal環境変数の設定

Modalでも同じ環境変数を設定する必要があります：

```bash
modal secret create realworld-agent-secrets \
  PRIMARY_LLM_PROVIDER=openai \
  ENABLE_LLM_FALLBACK=true \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  OPENAI_MODEL=gpt-4o \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## 🎯 ユースケース別設定

### ケース1: OpenAIクレジットを優先的に消化したい

```env
PRIMARY_LLM_PROVIDER=openai
ENABLE_LLM_FALLBACK=true
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  # バックアップ用
```

**動作**：
- すべてのLLM処理でOpenAIが使用されます
- OpenAIがエラーになった場合のみAnthropicにフォールバック

### ケース2: Anthropicを優先したい

```env
PRIMARY_LLM_PROVIDER=anthropic
ENABLE_LLM_FALLBACK=true
OPENAI_API_KEY=your_openai_key  # バックアップ用
ANTHROPIC_API_KEY=your_anthropic_key
```

**動作**：
- すべてのLLM処理でAnthropicが使用されます
- Anthropicがエラーになった場合のみOpenAIにフォールバック

### ケース3: OpenAIのみ使用（フォールバックなし）

```env
PRIMARY_LLM_PROVIDER=openai
ENABLE_LLM_FALLBACK=false
OPENAI_API_KEY=your_openai_key
```

**動作**：
- OpenAIのみ使用
- エラー時はフォールバックせず、エラーを返す

### ケース4: Anthropicのみ使用（フォールバックなし）

```env
PRIMARY_LLM_PROVIDER=anthropic
ENABLE_LLM_FALLBACK=false
ANTHROPIC_API_KEY=your_anthropic_key
```

**動作**：
- Anthropicのみ使用
- エラー時はフォールバックせず、エラーを返す

## 🔄 フォールバック機能

`ENABLE_LLM_FALLBACK=true` の場合、以下のような動作になります：

```
1. プライマリLLMで処理を試行
   ↓ エラーの場合
2. セカンダリLLMで処理を再試行
   ↓ 成功
3. 結果を返す（どのモデルを使用したかも記録）
```

### フォールバックが発生するケース

- APIキーが無効
- レート制限に達した
- APIサーバーがダウン
- タイムアウト
- その他のAPIエラー

## 📊 モデル選択ガイド

### OpenAI GPT-4o

**長所**：
- 高速な処理速度
- 画像認識の精度が高い
- JSONモードなど構造化出力が得意
- コストが比較的安い

**短所**：
- 日本語の文脈理解がClaudeに比べてやや劣る場合がある
- 長文生成の一貫性

**推奨用途**：
- 画像分析
- 構造化データの抽出
- リアルタイム処理が必要な場合

### Anthropic Claude 3.5 Sonnet

**長所**：
- 日本語の文脈理解が優れている
- 長文生成の一貫性が高い
- 倫理的な配慮が強い
- コード生成が得意

**短所**：
- レスポンスがやや遅い場合がある
- コストがやや高い

**推奨用途**：
- 仕様書生成
- 議事録作成
- コード生成
- 複雑な文脈理解が必要な場合

## 🧪 設定の確認

### 1. 現在の設定を確認

GPUサーバーのログで確認できます：

```bash
modal run modal_app.py
```

ログに以下のように表示されます：

```
🖼️ 画像分析開始（プライマリ: openai）
  🤖 OpenAI (gpt-4o)で画像分析中...
✅ 画像分析完了
```

### 2. フォールバックのテスト

プライマリLLMのAPIキーを一時的に無効にすることで、フォールバックが動作するか確認できます：

```bash
# プライマリをopenaiに設定
PRIMARY_LLM_PROVIDER=openai

# OpenAIのAPIキーを無効化（テスト用）
OPENAI_API_KEY=invalid_key

# フォールバック有効
ENABLE_LLM_FALLBACK=true
```

ログに以下のように表示されれば成功：

```
🖼️ 画像分析開始（プライマリ: openai）
⚠️ プライマリLLM（openai）エラー: Invalid API key
🔄 フォールバック: anthropicで再試行
  🤖 Anthropic (claude-3-5-sonnet-20241022)で画像分析中...
✅ 画像分析完了
```

## 💰 コスト最適化

### OpenAIクレジット（$50）を最大活用する設定

```env
PRIMARY_LLM_PROVIDER=openai
ENABLE_LLM_FALLBACK=false  # フォールバックを無効にしてOpenAIのみ使用
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o  # または gpt-4o-mini でコスト削減
```

### コスト削減のヒント

1. **モデルの選択**
   - 高精度が必要: `gpt-4o` または `claude-3-5-sonnet-20241022`
   - コスト重視: `gpt-4o-mini`（OpenAI）

2. **フォールバックの制御**
   - フォールバックを無効にすることで、予期しないプロバイダーの使用を防ぐ

3. **使用状況の監視**
   - OpenAI Dashboard: https://platform.openai.com/usage
   - Anthropic Console: https://console.anthropic.com/

## 🔍 トラブルシューティング

### 問題: 「プライマリLLMエラー」が頻発する

**解決策**：
1. APIキーが正しいか確認
2. API利用制限に達していないか確認
3. ネットワーク接続を確認

### 問題: フォールバックが動作しない

**解決策**：
1. `ENABLE_LLM_FALLBACK=true` が設定されているか確認
2. セカンダリLLMのAPIキーが設定されているか確認
3. Modalシークレットが更新されているか確認

### 問題: 意図しないモデルが使用される

**解決策**：
1. `.env` ファイルの `PRIMARY_LLM_PROVIDER` を確認
2. Modalシークレットを再作成：
   ```bash
   modal secret delete realworld-agent-secrets
   modal secret create realworld-agent-secrets ...
   ```
3. GPUサーバーを再デプロイ：
   ```bash
   modal deploy modal_app.py
   ```

## 📚 関連ドキュメント

- [SETUP.md](../SETUP.md) - 初期セットアップ
- [QUICKSTART_JA.md](../QUICKSTART_JA.md) - クイックスタート
- [README.md](../README.md) - プロジェクト概要

## 🔗 外部リンク

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Modal Documentation](https://modal.com/docs)

