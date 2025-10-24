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

    return web_app

