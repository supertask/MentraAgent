"""
Modal GPU Server Application
WhisperX、pyannote、Vision LLMを使用した高度なAI処理
"""

import modal
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

# Modalアプリの作成
app = modal.App("realworld-agent")

# GPU環境とモデルキャッシュ用のVolume
models_volume = modal.Volume.from_name("realworld-agent-models", create_if_missing=True)

# Docker イメージの定義
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg",
        "git",
        "pkg-config",
        "libavformat-dev",
        "libavcodec-dev",
        "libavdevice-dev",
        "libavutil-dev",
        "libswscale-dev",
        "libswresample-dev",
        "libavfilter-dev",
    )
    .pip_install(
        # 仕様書生成に必要なパッケージ（最小構成）
        "anthropic>=0.40.0",
        "openai>=1.54.0",
        "Pillow>=10.2.0",
        "python-dotenv>=1.0.1",
        "fastapi[all]>=0.109.2",
        "pydantic>=2.6.1",
        # 音声文字起こし用（現在は無効化）
        # "torch==2.1.0",
        # "torchaudio==2.1.0",
        # "whisperx==3.1.1",
        # "pyannote.audio==3.1.1",
        # "openai-whisper==20231117",
        # "faster-whisper==0.9.0",
        # "numpy==1.24.3",
        # "scipy==1.11.4",
        # "scikit-learn==1.3.2",
        # "opencv-python-headless==4.8.1.78",
    )
)

# Secrets（環境変数）
secrets = [
    modal.Secret.from_name("realworld-agent-secrets"),
]


@app.cls(
    image=image,
    # gpu="A10G",  # GPUは音声文字起こし時のみ必要（現在は無効化）
    secrets=secrets,
    volumes={"/models": models_volume},
    timeout=600,  # 10分タイムアウト
    # keep_warm=1,  # コスト削減のため無効化（コールドスタートあり：20-60秒）
)
class RealworldAgentGPU:
    """
    GPUを使用したAI処理クラス
    """

    def __init__(self):
        """初期化"""
        self.whisperx_model = None
        self.diarization_pipeline = None
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.primary_llm_provider = os.getenv("PRIMARY_LLM_PROVIDER", "openai")
        self.enable_llm_fallback = os.getenv("ENABLE_LLM_FALLBACK", "true").lower() == "true"
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    @modal.enter()
    def load_models(self):
        """モデルの読み込み（起動時に1回だけ実行）"""
        print("🚀 初期化中...")
        print("✅ 初期化完了")
        print("ℹ️  WhisperX/pyannoteは現在無効化されています（仕様書生成のみ利用可能）")

    @modal.method()
    def transcribe_audio(
        self,
        audio_path: str,
        language: str = "ja",
        enable_diarization: bool = True,
        min_speakers: int = 1,
        max_speakers: int = 10,
    ) -> Dict[str, Any]:
        """
        音声文字起こし（WhisperX + 話者分離）

        Args:
            audio_path: 音声ファイルのパス
            language: 言語コード
            enable_diarization: 話者分離を有効にするか
            min_speakers: 最小話者数
            max_speakers: 最大話者数

        Returns:
            文字起こし結果
        """
        import whisperx

        print(f"🎙️ 音声文字起こし開始: {audio_path}")

        try:
            # 音声読み込み
            audio = whisperx.load_audio(audio_path)

            # WhisperXで文字起こし
            print("📝 WhisperXで文字起こし中...")
            result = self.whisperx_model.transcribe(
                audio,
                language=language,
                batch_size=16,
            )

            # 単語レベルのアライメント
            print("🔤 単語レベルのアライメント中...")
            model_a, metadata = whisperx.load_align_model(
                language_code=language,
                device=self.device,
            )
            result = whisperx.align(
                result["segments"],
                model_a,
                metadata,
                audio,
                self.device,
                return_char_alignments=False,
            )

            # 話者分離
            speakers_result = None
            if enable_diarization and self.diarization_pipeline:
                print("🎤 話者分離中...")
                try:
                    diarization = self.diarization_pipeline(
                        audio_path,
                        min_speakers=min_speakers,
                        max_speakers=max_speakers,
                    )

                    # 話者情報を結果に統合
                    result = whisperx.assign_word_speakers(diarization, result)
                    speakers_result = self._extract_speakers(result)
                    print(f"✅ {len(set(speakers_result))} 人の話者を検出")
                except Exception as e:
                    print(f"⚠️ 話者分離エラー: {e}")

            # 結果の整形
            output = {
                "text": " ".join([seg["text"] for seg in result["segments"]]),
                "segments": result["segments"],
                "language": language,
                "speakers": speakers_result,
                "timestamp": datetime.now().isoformat(),
            }

            print("✅ 音声文字起こし完了")
            return output

        except Exception as e:
            print(f"❌ 音声文字起こしエラー: {e}")
            raise

    @modal.method()
    def analyze_image(
        self,
        image_data: bytes,
        prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        画像分析（Claude Vision or GPT-4V）

        Args:
            image_data: 画像データ（バイト列）
            prompt: カスタムプロンプト

        Returns:
            画像分析結果
        """
        import base64

        print(f"🖼️ 画像分析開始（プライマリ: {self.primary_llm_provider}）")

        # Base64エンコード
        image_base64 = base64.b64encode(image_data).decode("utf-8")

        # デフォルトプロンプト
        if not prompt:
            prompt = """
この画像を詳しく分析してください：
1. 何が映っているか（オブジェクト、人物、風景など）
2. 技術的な要素（コード、図、UI、ホワイトボードなど）
3. 重要な情報（テキスト、数字、記号など）
4. 全体的なシーンの説明

JSON形式で回答してください：
{
  "description": "全体的な説明",
  "objects": ["検出されたオブジェクトリスト"],
  "text": "画像内のテキスト",
  "scene": "シーンの種類",
  "technical_elements": ["技術的な要素"]
}
"""

        try:
            # プライマリLLMで試行
            result = self._analyze_image_with_provider(
                image_base64, 
                prompt, 
                self.primary_llm_provider
            )
            return result

        except Exception as e:
            print(f"⚠️ プライマリLLM（{self.primary_llm_provider}）エラー: {e}")
            
            # フォールバックが有効な場合
            if self.enable_llm_fallback:
                fallback_provider = "anthropic" if self.primary_llm_provider == "openai" else "openai"
                print(f"🔄 フォールバック: {fallback_provider}で再試行")
                
                try:
                    result = self._analyze_image_with_provider(
                        image_base64, 
                        prompt, 
                        fallback_provider
                    )
                    return result
                except Exception as fallback_error:
                    print(f"❌ フォールバックLLMもエラー: {fallback_error}")
                    raise
            else:
                raise

    @modal.method()
    def detect_scene_changes(
        self,
        frames: List[bytes],
        threshold: float = 0.3,
    ) -> List[int]:
        """
        シーン変化検出

        Args:
            frames: フレーム画像のリスト
            threshold: 変化検出の閾値

        Returns:
            シーン変化が検出されたフレームのインデックス
        """
        import cv2
        import numpy as np

        print(f"🎬 シーン変化検出開始（{len(frames)} フレーム）")

        try:
            changes = []
            prev_frame = None

            for i, frame_data in enumerate(frames):
                # バイト列から画像に変換
                nparr = np.frombuffer(frame_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if prev_frame is not None:
                    # ヒストグラム比較
                    hist1 = cv2.calcHist([prev_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                    hist2 = cv2.calcHist([frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])

                    cv2.normalize(hist1, hist1)
                    cv2.normalize(hist2, hist2)

                    # 類似度計算
                    similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

                    # 閾値以下なら変化とみなす
                    if similarity < (1.0 - threshold):
                        changes.append(i)
                        print(f"  📍 フレーム {i}: 変化検出（類似度: {similarity:.3f}）")

                prev_frame = frame

            print(f"✅ {len(changes)} 箇所のシーン変化を検出")
            return changes

        except Exception as e:
            print(f"❌ シーン変化検出エラー: {e}")
            raise

    @modal.method()
    def generate_specification(
        self,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        仕様書生成

        Args:
            context: コンテキスト情報（文字起こし、画像など）

        Returns:
            生成された仕様書
        """
        print(f"📄 仕様書生成開始（プライマリ: {self.primary_llm_provider}）")

        # プロンプトの構築
        prompt = self._build_specification_prompt(context)

        try:
            # プライマリLLMで試行
            result = self._generate_text_with_provider(
                prompt,
                self.primary_llm_provider,
                max_tokens=4096
            )
            
            specification_text = result["content"]
            
            output = {
                "title": self._extract_title(specification_text),
                "content": specification_text,
                "model": result["model"],
                "timestamp": datetime.now().isoformat(),
            }

            print("✅ 仕様書生成完了")
            return output

        except Exception as e:
            print(f"⚠️ プライマリLLM（{self.primary_llm_provider}）エラー: {e}")
            
            # フォールバックが有効な場合
            if self.enable_llm_fallback:
                fallback_provider = "anthropic" if self.primary_llm_provider == "openai" else "openai"
                print(f"🔄 フォールバック: {fallback_provider}で再試行")
                
                try:
                    result = self._generate_text_with_provider(
                        prompt,
                        fallback_provider,
                        max_tokens=4096
                    )
                    
                    specification_text = result["content"]
                    
                    output = {
                        "title": self._extract_title(specification_text),
                        "content": specification_text,
                        "model": result["model"],
                        "timestamp": datetime.now().isoformat(),
                    }

                    print("✅ 仕様書生成完了（フォールバック）")
                    return output
                    
                except Exception as fallback_error:
                    print(f"❌ フォールバックLLMもエラー: {fallback_error}")
                    raise
            else:
                raise

    @modal.method()
    def generate_code(
        self,
        request: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        コード生成

        Args:
            request: コード生成リクエスト
                - prompt: ユーザーの要求（必須）
                - context: コンテキスト情報（文字起こし、仕様書など）
                - language: プログラミング言語（オプション）
                - framework: フレームワーク（オプション）

        Returns:
            生成されたコード
        """
        print(f"💻 コード生成開始（プライマリ: {self.primary_llm_provider}）")

        # プロンプトの構築
        prompt = self._build_code_generation_prompt(request)

        try:
            # プライマリLLMで試行
            result = self._generate_text_with_provider(
                prompt,
                self.primary_llm_provider,
                max_tokens=8192  # コード生成は長めに
            )
            
            code_text = result["content"]
            
            # コードファイルの抽出
            files = self._extract_code_files(code_text)
            
            # プロジェクト概要の抽出
            project_summary = self._extract_project_summary(code_text)
            
            output = {
                "files": files,
                "dependencies": self._extract_dependencies(code_text),
                "instructions": self._extract_instructions(code_text),
                "summary": project_summary,
                "model": result["model"],
                "timestamp": datetime.now().isoformat(),
            }

            print(f"✅ コード生成完了（{len(files)}ファイル）")
            print(f"📊 プロジェクト名: {project_summary['name']}")
            return output

        except Exception as e:
            print(f"⚠️ プライマリLLM（{self.primary_llm_provider}）エラー: {e}")
            
            # フォールバックが有効な場合
            if self.enable_llm_fallback:
                fallback_provider = "anthropic" if self.primary_llm_provider == "openai" else "openai"
                print(f"🔄 フォールバック: {fallback_provider}で再試行")
                
                try:
                    result = self._generate_text_with_provider(
                        prompt,
                        fallback_provider,
                        max_tokens=8192
                    )
                    
                    code_text = result["content"]
                    files = self._extract_code_files(code_text)
                    project_summary = self._extract_project_summary(code_text)
                    
                    output = {
                        "files": files,
                        "dependencies": self._extract_dependencies(code_text),
                        "instructions": self._extract_instructions(code_text),
                        "summary": project_summary,
                        "model": result["model"],
                        "timestamp": datetime.now().isoformat(),
                    }

                    print(f"✅ コード生成完了（フォールバック、{len(files)}ファイル）")
                    print(f"📊 プロジェクト名: {project_summary['name']}")
                    return output
                    
                except Exception as fallback_error:
                    print(f"❌ フォールバックLLMもエラー: {fallback_error}")
                    raise
            else:
                raise

    # ヘルパーメソッド

    def _extract_speakers(self, result: Dict) -> List[str]:
        """話者リストを抽出"""
        speakers = set()
        for segment in result.get("segments", []):
            if "speaker" in segment:
                speakers.add(segment["speaker"])
        return sorted(list(speakers))

    def _build_specification_prompt(self, context: Dict[str, Any]) -> str:
        """仕様書生成用のプロンプトを構築"""
        transcriptions = context.get("transcriptions", [])
        photos = context.get("photos", [])

        prompt = """
以下の会議・作業の記録から、技術仕様書を作成してください。

# 文字起こし
"""
        for trans in transcriptions[-20:]:  # 最新20件
            speaker = trans.get("speaker", "不明")
            text = trans.get("text", "")
            prompt += f"\n[{speaker}] {text}"

        prompt += """

# 要求事項
- 明確で構造化された仕様書を作成
- 要件、技術詳細、実装手順を含める
- Markdown形式で出力

# 出力形式
## タイトル
## 概要
## 要件
### 機能要件
### 非機能要件
## 技術詳細
## 実装手順
## 備考
"""
        return prompt

    def _extract_title(self, text: str) -> str:
        """タイトルを抽出"""
        lines = text.split("\n")
        for line in lines:
            if line.startswith("# "):
                return line.replace("# ", "").strip()
        return "仕様書"

    def _build_code_generation_prompt(self, request: Dict[str, Any]) -> str:
        """コード生成用のプロンプトを構築"""
        user_prompt = request.get("prompt", "")
        context = request.get("context", {})
        language = request.get("language", "")
        framework = request.get("framework", "")
        
        transcriptions = context.get("transcriptions", [])
        specification = context.get("specification", "")
        
        prompt = f"""
あなたはプロフェッショナルなソフトウェアエンジニアです。
以下の要求に基づいて、実装可能なプロジェクトを生成してください。

# ユーザーの要求
{user_prompt}

"""
        
        # コンテキスト情報を追加
        if specification:
            prompt += f"""
# 仕様書
{specification}

"""
        
        if transcriptions:
            prompt += """
# 会議の文字起こし
"""
            for trans in transcriptions[-10:]:  # 最新10件
                speaker = trans.get("speaker", "不明")
                text = trans.get("text", "")
                prompt += f"\n[{speaker}] {text}"
            prompt += "\n"
        
        # 言語・フレームワーク指定
        if language:
            prompt += f"""
# 使用する言語
{language}
"""
        
        if framework:
            prompt += f"""
# 使用するフレームワーク
{framework}
"""
        
        prompt += """

---

# 出力形式

以下の形式で**必ず厳密に**出力してください。各セクションは**必須**です。

## プロジェクト概要
プロジェクト名: 【要求内容に基づいた具体的なプロジェクト名】
説明: 【プロジェクトの目的と機能を1-2行で簡潔に説明】
主な機能:
- 【機能1: 具体的な説明】
- 【機能2: 具体的な説明】
- 【機能3: 具体的な説明】

**例（構造計算の場合）:**
プロジェクト名: 建築構造計算システム
説明: 設計図と材料データから建築物の構造安全性を自動計算・検証するWebアプリケーション
主な機能:
- 設計図画像のアップロードと解析
- 材料データのスプレッドシート入力
- 構造計算の自動実行と結果表示

## 技術スタック
- 言語: 【使用言語】
- フレームワーク: 【使用フレームワーク（ある場合）】
- 主要ライブラリ: 【主要なライブラリをカンマ区切りで】

## プロジェクト構造
```mermaid
graph TD
    A[【エントリーポイント名】] --> B[【主要モジュール名】]
    B --> C[【サブモジュール1名】]
    B --> D[【サブモジュール2名】]
    C --> E[【ユーティリティ名】]
    D --> E
    
    style A fill:#667eea
    style B fill:#764ba2
    style C fill:#f093fb
    style D fill:#f093fb
    style E fill:#4facfe
```

**重要: 実際のプロジェクト構造に合わせてMermaid図を作成してください**

## 依存関係
```
【パッケージ1==バージョン】
【パッケージ2==バージョン】
【パッケージ3==バージョン】
```

---

## コード

### ファイル: README.md
```markdown
# 【プロジェクト名（要求内容に基づいた具体的な名前）】

> 【プロジェクトの簡潔な説明（1行）】

## 📋 概要

【プロジェクトの目的、背景、解決する課題を3-5行で説明】

## ✨ 主な機能

- **【機能1】**: 【詳細説明】
- **【機能2】**: 【詳細説明】  
- **【機能3】**: 【詳細説明】

## 🏗️ プロジェクト構造

\```mermaid
graph TD
    A[【エントリーポイント】] --> B[【メインモジュール】]
    B --> C[【サブモジュール1】]
    B --> D[【サブモジュール2】]
    C --> E[【ユーティリティ】]
    D --> E
    
    style A fill:#667eea
    style B fill:#764ba2
    style C fill:#f093fb
    style D fill:#f093fb
    style E fill:#4facfe
\```

## 🛠️ 技術スタック

- **言語**: 【言語】
- **フレームワーク**: 【フレームワーク】
- **主要ライブラリ**: 【ライブラリ1】、【ライブラリ2】、【ライブラリ3】

## 📦 セットアップ

### 必要な環境

- 【言語名】 【バージョン】以上
- 【その他の依存関係】

### インストール手順

\```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd <project-directory>

# 2. 依存関係のインストール
【インストールコマンド（例: pip install -r requirements.txt）】

# 3. 環境変数の設定（必要な場合）
【環境変数の設定方法】
\```

## 🚀 使い方

### 基本的な実行方法

\```bash
# 【実行コマンドと簡単な説明】
【実行コマンド（例: python app.py）】
\```

### 使用例

\```bash
# 例1: 【使用例1の説明】
【コマンド例1】

# 例2: 【使用例2の説明】
【コマンド例2】
\```

## 📁 ファイル構成

\```
【プロジェクトのディレクトリツリー】
例:
.
├── README.md
├── app.py
├── requirements.txt
├── static/
│   └── style.css
└── templates/
    └── index.html
\```

## 🔧 トラブルシューティング

### 【問題1】
- **症状**: 【症状の説明】
- **解決方法**: 【解決方法】

### 【問題2】
- **症状**: 【症状の説明】
- **解決方法**: 【解決方法】

## 📝 ライセンス

MIT License
\```

### ファイル: 【ファイルパス1（例: app.py）】
```【言語名】
【実装コード - 必要最低限だが動作する完全なコード】
【詳細なコメントを含める】
【エラーハンドリングを実装】
```

### ファイル: 【ファイルパス2】
```【言語名】
【実装コード】
```

### ファイル: requirements.txt
```
【依存関係リスト】
```

---

## セットアップ手順
1. 【具体的な手順1】
2. 【具体的な手順2】
3. 【具体的な手順3】

## 実行方法
\```bash
# 【実行コマンドの説明】
【実行コマンド】
\```

---

**重要な要件:**
1. ✅ プロジェクト名は要求内容を反映した具体的な名前にする
2. ✅ README.mdを**必ず最初に**生成する
3. ✅ README.mdはGitHub標準に準拠した見やすい形式で
4. ✅ Mermaid図は実際のプロジェクト構造を正確に反映
5. ✅ コードは必要最低限だが完全に動作する状態
6. ✅ すぐに実行できるように依存関係とセットアップ手順を明記
7. ✅ エラーハンドリング、ログ、詳細なコメントを含める

**出力例（構造計算の場合のプロジェクト名）:**
- ❌ 悪い例: "generated-project", "sample-app"
- ✅ 良い例: "建築構造計算システム", "構造安全性検証ツール"
"""
        
        return prompt

    def _extract_code_files(self, text: str) -> List[Dict[str, str]]:
        """
        生成されたテキストからコードファイルを抽出
        
        形式: ### ファイル: path/to/file.ext
              ```language
              code here
              ```
        """
        import re
        
        files = []
        
        # パターン: ### ファイル: path/to/file.ext の後に ``` で囲まれたコード
        pattern = r'###\s*ファイル:\s*([^\n]+)\s*```(\w+)?\s*\n(.*?)```'
        matches = re.finditer(pattern, text, re.DOTALL)
        
        for match in matches:
            filepath = match.group(1).strip()
            language = match.group(2) or self._detect_language_from_path(filepath)
            content = match.group(3).strip()
            
            files.append({
                "path": filepath,
                "content": content,
                "language": language,
            })
            
            print(f"  📄 抽出: {filepath} ({language})")
        
        # 代替パターン: ```language:filename
        alt_pattern = r'```(\w+):([^\n]+)\s*\n(.*?)```'
        alt_matches = re.finditer(alt_pattern, text, re.DOTALL)
        
        for match in alt_matches:
            language = match.group(1).strip()
            filepath = match.group(2).strip()
            content = match.group(3).strip()
            
            # 既に同じファイルが抽出されていないかチェック
            if not any(f["path"] == filepath for f in files):
                files.append({
                    "path": filepath,
                    "content": content,
                    "language": language,
                })
                print(f"  📄 抽出（代替形式）: {filepath} ({language})")
        
        return files

    def _extract_dependencies(self, text: str) -> List[str]:
        """依存関係を抽出"""
        import re
        
        dependencies = []
        
        # ## 依存関係 セクションを探す
        dep_pattern = r'##\s*依存関係\s*```[^\n]*\n(.*?)```'
        match = re.search(dep_pattern, text, re.DOTALL)
        
        if match:
            dep_text = match.group(1).strip()
            # 各行を依存関係として追加
            for line in dep_text.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    dependencies.append(line)
        
        return dependencies

    def _extract_instructions(self, text: str) -> str:
        """セットアップ手順と実行方法を抽出"""
        import re
        
        instructions = []
        
        # ## セットアップ手順 セクションを探す
        setup_pattern = r'##\s*セットアップ手順\s*\n(.*?)(?=##|$)'
        setup_match = re.search(setup_pattern, text, re.DOTALL)
        
        if setup_match:
            instructions.append("# セットアップ手順")
            instructions.append(setup_match.group(1).strip())
        
        # ## 実行方法 セクションを探す
        run_pattern = r'##\s*実行方法\s*\n(.*?)(?=##|$)'
        run_match = re.search(run_pattern, text, re.DOTALL)
        
        if run_match:
            instructions.append("\n# 実行方法")
            instructions.append(run_match.group(1).strip())
        
        return "\n".join(instructions) if instructions else "セットアップ手順は生成されたコードに含まれています。"

    def _detect_language_from_path(self, filepath: str) -> str:
        """ファイルパスから言語を推測"""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.sh': 'bash',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.md': 'markdown',
        }
        
        import os
        _, ext = os.path.splitext(filepath)
        return ext_map.get(ext.lower(), 'text')
    
    def _extract_project_summary(self, text: str) -> Dict[str, Any]:
        """プロジェクト概要を抽出"""
        import re
        
        summary = {
            "name": "生成されたプロジェクト",
            "description": "",
            "features": [],
            "tech_stack": {
                "language": "",
                "framework": "",
                "libraries": []
            },
            "mermaid_diagram": ""
        }
        
        # プロジェクト名
        name_pattern = r'プロジェクト名:\s*(?:【)?([^】\n]+)(?:】)?'
        name_match = re.search(name_pattern, text)
        if name_match:
            summary["name"] = name_match.group(1).strip()
        
        # 説明
        desc_pattern = r'説明:\s*(?:【)?([^】\n]+)(?:】)?'
        desc_match = re.search(desc_pattern, text)
        if desc_match:
            summary["description"] = desc_match.group(1).strip()
        
        # 主な機能
        features_pattern = r'主な機能:?\s*\n((?:-\s+[^\n]+\n?)+)'
        features_match = re.search(features_pattern, text)
        if features_match:
            for line in features_match.group(1).split('\n'):
                if line.strip().startswith('-'):
                    feature = line.strip()[1:].strip()
                    if feature:
                        summary["features"].append(feature)
        
        # 技術スタック
        lang_pattern = r'-\s*言語:\s*(?:【)?([^】\n]+)(?:】)?'
        lang_match = re.search(lang_pattern, text)
        if lang_match:
            summary["tech_stack"]["language"] = lang_match.group(1).strip()
        
        fw_pattern = r'-\s*フレームワーク:\s*(?:【)?([^】\n]+)(?:】)?'
        fw_match = re.search(fw_pattern, text)
        if fw_match:
            summary["tech_stack"]["framework"] = fw_match.group(1).strip()
        
        lib_pattern = r'-\s*主要ライブラリ:\s*(?:【)?([^】\n]+)(?:】)?'
        lib_match = re.search(lib_pattern, text)
        if lib_match:
            libs = lib_match.group(1).strip()
            summary["tech_stack"]["libraries"] = [l.strip() for l in libs.split(',') if l.strip()]
        
        # Mermaid図
        mermaid_pattern = r'```mermaid\s*\n(.*?)```'
        mermaid_match = re.search(mermaid_pattern, text, re.DOTALL)
        if mermaid_match:
            summary["mermaid_diagram"] = mermaid_match.group(1).strip()
        
        return summary

    def _analyze_image_with_provider(
        self,
        image_base64: str,
        prompt: str,
        provider: str,
    ) -> Dict[str, Any]:
        """
        指定されたプロバイダーで画像分析を実行

        Args:
            image_base64: Base64エンコードされた画像
            prompt: プロンプト
            provider: 'openai' または 'anthropic'

        Returns:
            画像分析結果
        """
        if provider == "openai":
            from openai import OpenAI
            
            print(f"  🤖 OpenAI ({self.openai_model})で画像分析中...")
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1024,
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model": self.openai_model,
                "timestamp": datetime.now().isoformat(),
            }
            
        elif provider == "anthropic":
            from anthropic import Anthropic
            
            print(f"  🤖 Anthropic ({self.anthropic_model})で画像分析中...")
            client = Anthropic(api_key=self.anthropic_api_key)
            
            response = client.messages.create(
                model=self.anthropic_model,
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_base64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )
            
            return {
                "analysis": response.content[0].text,
                "model": self.anthropic_model,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            raise ValueError(f"未サポートのプロバイダー: {provider}")

    def _generate_text_with_provider(
        self,
        prompt: str,
        provider: str,
        max_tokens: int = 4096,
    ) -> Dict[str, Any]:
        """
        指定されたプロバイダーでテキスト生成を実行

        Args:
            prompt: プロンプト
            provider: 'openai' または 'anthropic'
            max_tokens: 最大トークン数

        Returns:
            生成結果
        """
        if provider == "openai":
            from openai import OpenAI
            
            print(f"  🤖 OpenAI ({self.openai_model})でテキスト生成中...")
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": self.openai_model,
            }
            
        elif provider == "anthropic":
            from anthropic import Anthropic
            
            print(f"  🤖 Anthropic ({self.anthropic_model})でテキスト生成中...")
            client = Anthropic(api_key=self.anthropic_api_key)
            
            response = client.messages.create(
                model=self.anthropic_model,
                max_tokens=max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )
            
            return {
                "content": response.content[0].text,
                "model": self.anthropic_model,
            }
        else:
            raise ValueError(f"未サポートのプロバイダー: {provider}")


# FastAPI Webエンドポイント
@app.function(image=image, secrets=secrets)
@modal.asgi_app()
def fastapi_app():
    """
    FastAPI Webエンドポイント
    """
    from fastapi import FastAPI, UploadFile, File, Form, Request
    from fastapi.responses import JSONResponse

    web_app = FastAPI(title="Realworld Agent GPU API")

    @web_app.get("/")
    async def root():
        return {
            "name": "Realworld Agent GPU Server",
            "version": "0.1.0",
            "status": "running",
        }

    @web_app.get("/health")
    async def health():
        return {"status": "healthy"}

    @web_app.post("/api/transcribe")
    async def transcribe(
        audio: UploadFile = File(...),
        language: str = Form("ja"),
        enable_diarization: bool = Form(True),
    ):
        """音声文字起こしAPI"""
        try:
            # 一時ファイルに保存
            temp_path = f"/tmp/{audio.filename}"
            with open(temp_path, "wb") as f:
                f.write(await audio.read())

            # GPUクラスを呼び出し
            gpu = RealworldAgentGPU()
            result = gpu.transcribe_audio.remote(
                temp_path,
                language=language,
                enable_diarization=enable_diarization,
            )

            return JSONResponse(content=result)

        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)},
            )

    @web_app.post("/api/analyze-image")
    async def analyze_image(image: UploadFile = File(...)):
        """画像分析API"""
        try:
            image_data = await image.read()

            gpu = RealworldAgentGPU()
            result = gpu.analyze_image.remote(image_data)

            return JSONResponse(content=result)

        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)},
            )

    @web_app.post("/generate-spec")
    async def generate_specification(request: Request):
        """仕様書生成API"""
        try:
            body = await request.json()
            context = body.get("context", {})

            gpu = RealworldAgentGPU()
            result = gpu.generate_specification.remote(context)

            return JSONResponse(content=result)

        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)},
            )

    @web_app.post("/api/generate-code")
    async def generate_code(request: Request):
        """コード生成API"""
        try:
            body = await request.json()

            gpu = RealworldAgentGPU()
            result = gpu.generate_code.remote(body)

            return JSONResponse(content=result)

        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)},
            )

    return web_app

