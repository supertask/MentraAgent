# コード生成機能ガイド

Realworld Agentのコード生成機能の使い方を説明します。

## 概要

このシステムは、音声文字起こしからユーザーの意図を検出し、LLMを使用して自動的にコードを生成します。

**特徴**:
- 🎤 音声からコード生成の意図を自動検出
- 💻 複数ファイル・複数言語対応
- 🔄 GitHub PR自動作成（オプション）
- 📝 仕様書からのコンテキスト統合
- ✨ LLMプロバイダー切り替え（OpenAI/Anthropic）

## 使い方

### 1. 音声でコード生成をリクエスト

Mentra GlassまたはWebカメラを使用して、以下のような音声でリクエストします：

#### 基本的な例

```
「Pythonでファイルを読み込むプログラムを生成してください」
「JavaScriptでReactのボタンコンポーネントを作って」
「Goでシンプルなウェブサーバーを実装してほしい」
```

#### より具体的な例

```
「TypeScriptとNext.jsでログインフォームのコンポーネントを生成してください。
メールアドレスとパスワードのバリデーションも含めて」

「Pythonでデータベースに接続して、ユーザー情報を取得するスクリプトを作って。
SQLAlchemyを使用してください」

「Rustでコマンドラインツールを実装してほしい。
ファイルを読み込んで、単語数をカウントする機能を持たせて」
```

### 2. トリガーキーワード

コード生成を起動するために、以下のキーワードの組み合わせを使用してください：

**コード関連キーワード**（必須）:
- プログラム / コード / ソースコード
- スクリプト / 実装 / 開発
- プログラミング / コーディング

**アクション**（必須）:
- 生成 / 作成 / 作って / 書いて
- つくって / かいて
- generate / create / write / make

**依頼表現**（推奨）:
- してください / してほしい / お願い
- ください / please

**信頼度スコア**: 0.7以上で自動的にコード生成が開始されます。

### 3. 自動検出の仕組み

システムは以下の方法でコード生成の意図を判定します：

1. **コード関連キーワードの検出** (必須)
   - 「プログラム」「コード」などが含まれているか

2. **生成の意図** (+0.6)
   - 「生成」「作成」などのアクションワードがあるか

3. **依頼表現** (+0.3)
   - 「してください」「お願い」などの依頼表現があるか

4. **技術スタックの言及** (+0.2)
   - Python、JavaScript、Reactなどの具体的な技術名があるか

**合計スコアが0.7以上の場合、自動的にコード生成が開始されます。**

### 4. 生成されるもの

コード生成リクエストを受け取ると、以下が生成されます：

1. **複数のコードファイル**
   - 適切なディレクトリ構造
   - ファイルごとの言語指定
   - コメント付きコード

2. **依存関係リスト**
   - 必要なパッケージ
   - バージョン指定

3. **セットアップ手順**
   - インストール方法
   - 環境設定

4. **実行方法**
   - 実行コマンド
   - 使用例

### 5. GitHub PR自動作成（オプション）

環境変数を設定することで、生成されたコードを自動的にGitHub PRとして作成できます。

#### 環境変数設定

```env
# GitHub設定
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repository
```

#### APIリクエストでPR作成を有効化

```json
POST /api/processing/generate-code
{
  "sessionId": "session-123",
  "prompt": "Pythonでファイル読み込みプログラムを生成",
  "language": "python",
  "createPR": {
    "enabled": true,
    "title": "自動生成: ファイル読み込み機能",
    "baseBranch": "main"
  }
}
```

#### PR作成時の動作

1. 新しいブランチを自動作成 (`feature/auto-generated-{timestamp}`)
2. 生成されたファイルをコミット
3. Pull Requestを作成
4. PR URLを返却

#### PR本文の例

```markdown
## 自動生成されたコード

**プロンプト**: Pythonでファイル読み込みプログラムを生成

**生成されたファイル**:
- `src/file_reader.py` (python)
- `tests/test_file_reader.py` (python)
- `requirements.txt` (text)

**依存関係**:
```
pytest==7.4.0
```

**セットアップ手順**:
1. pip install -r requirements.txt
2. python src/file_reader.py <ファイルパス>

---
_このPRは Realworld Agent によって自動生成されました_
```

## API仕様

### コード生成エンドポイント

```
POST /api/processing/generate-code
```

#### リクエストボディ

```typescript
{
  sessionId: string;           // 必須: セッションID
  prompt: string;              // 必須: ユーザーのリクエスト
  language?: string;           // オプション: プログラミング言語
  framework?: string;          // オプション: フレームワーク
  createPR?: {                 // オプション: GitHub PR作成設定
    enabled: boolean;
    title?: string;
    baseBranch?: string;       // デフォルト: 'main'
  };
}
```

#### レスポンス

```typescript
{
  files: Array<{
    path: string;              // ファイルパス
    content: string;           // ファイルの内容
    language: string;          // プログラミング言語
  }>;
  dependencies: string[];      // 依存関係のリスト
  instructions: string;        // セットアップ・実行手順
  model: string;              // 使用したLLMモデル
  prUrl?: string;             // GitHub PR URL（作成した場合）
}
```

## 対応言語・フレームワーク

### プログラミング言語

- Python
- JavaScript / TypeScript
- Java
- Go
- Rust
- Ruby
- PHP
- C# / C++

### フレームワーク

**フロントエンド**:
- React
- Vue
- Angular
- Next.js

**バックエンド**:
- Node.js / Express
- FastAPI / Django / Flask
- Ruby on Rails
- Laravel
- Spring

## トラブルシューティング

### コード生成が開始されない

**原因**: 信頼度スコアが0.7未満

**解決策**:
1. より明確な依頼表現を使用する
   - ❌ 「Pythonのコード」
   - ✅ 「Pythonのコードを生成してください」

2. 具体的な技術スタックを言及する
   - ❌ 「ウェブアプリを作って」
   - ✅ 「Reactでウェブアプリを作ってください」

### 生成されたコードが期待と異なる

**解決策**:
1. より詳細な要求を伝える
2. 仕様書を先に生成してから、コード生成をリクエストする
3. 具体的な機能要件を含める

### GitHub PR作成に失敗する

**原因**:
- GitHub トークンが設定されていない
- リポジトリへのアクセス権限がない
- ブランチ名の競合

**解決策**:
1. 環境変数を確認
2. GitHubトークンの権限を確認（`repo`スコープが必要）
3. エラーログを確認

## 実装例

### MentraOSアプリでの使用

```typescript
// RealWorldAgent.ts での自動検出
const codeIntent = this.importanceDetector.detectCodeGenerationIntent(data.text);
if (codeIntent.shouldGenerate) {
  await this.handleCodeGeneration(session, sessionId, codeIntent.extractedPrompt);
}
```

### Webクライアントでの使用

```javascript
// 手動でコード生成をリクエスト
async function generateCode(prompt, language) {
  const response = await fetch('/api/processing/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: currentSessionId,
      prompt: prompt,
      language: language,
      createPR: {
        enabled: true,
        title: `自動生成: ${prompt.substring(0, 50)}`
      }
    })
  });
  
  const result = await response.json();
  
  console.log('生成されたファイル:', result.files);
  if (result.prUrl) {
    console.log('GitHub PR:', result.prUrl);
  }
}
```

## ベストプラクティス

### 1. 明確な要求を伝える

✅ **Good**:
```
「TypeScriptでRESTful APIを実装してください。
ユーザーのCRUD操作ができるエンドポイントを含めて。
ExpressとPrismaを使用してください」
```

❌ **Bad**:
```
「API作って」
```

### 2. コンテキストを活用する

会議で議論した内容や、生成済みの仕様書は自動的にコンテキストとして使用されます。

**手順**:
1. 会議中に要件を議論
2. 仕様書を生成（ボタン長押し）
3. コード生成をリクエスト
   → 仕様書の内容が自動的に参照される

### 3. 段階的に生成

大きなプロジェクトは小さな部品に分けて生成することをお勧めします。

**例**:
1. 「データベースモデルを生成」
2. 「APIエンドポイントを生成」
3. 「フロントエンドコンポーネントを生成」

### 4. 生成後のレビュー

自動生成されたコードは必ずレビューしてください：
- セキュリティの確認
- エラーハンドリングの確認
- テストの追加

## 制限事項

1. **コールドスタート**: 初回起動時は20-60秒かかる場合があります
2. **ファイルサイズ**: 1リクエストあたり最大20ファイル推奨
3. **複雑さ**: 非常に複雑なシステムは複数回に分けて生成推奨
4. **言語理解**: 日本語・英語に対応（他言語は精度が低下する可能性）

## コスト

コード生成のコストは使用するLLMモデルによります：

| モデル | 推定コスト/リクエスト | 品質 |
|--------|---------------------|------|
| GPT-4o | $0.02-0.10 | ⭐⭐⭐⭐⭐ |
| Claude 3.5 Sonnet | $0.03-0.15 | ⭐⭐⭐⭐⭐ |

**コスト削減のヒント**:
- 具体的な要求でトークン数を削減
- 不要な再生成を避ける
- フォールバック機能を活用

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [LLM設定ガイド](./LLM_PROVIDER_CONFIGURATION.md) - LLMプロバイダー設定
- [GitHub統合](./GITHUB_INTEGRATION.md) - GitHub連携の詳細
- [API仕様書](./API_SPEC.md) - 完全なAPI仕様

---

**最終更新**: 2025-10-24

