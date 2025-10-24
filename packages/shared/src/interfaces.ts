/**
 * 共通インターフェース定義
 */

import type {
  TranscriptionData,
  PhotoData,
  PhotoRequest,
  StreamConfig,
  StreamInfo,
  StreamStatus,
  VoiceActivityData,
  AudioChunk,
  LocationItem,
  ImageAnalysis,
  EnhancedTranscription,
  RAGQuery,
  RAGResult,
  SpecificationRequest,
  Specification,
  CodeGenerationRequest,
  GeneratedCode,
  ContextData,
  ImportantMoment,
  SessionData,
  SlackNotification,
  GitHubPullRequest,
  NotionPage,
  DeviceCapabilities,
} from './types';

// ============================================
// 入力デバイスインターフェース
// ============================================

export interface IInputDevice {
  getType(): string;
  getCapabilities(): DeviceCapabilities;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface IAudioInput extends IInputDevice {
  startTranscription(): Promise<void>;
  stopTranscription(): Promise<void>;
  onTranscription(callback: (data: TranscriptionData) => void): () => void;
  onVoiceActivity(callback: (data: VoiceActivityData) => void): () => void;
  onAudioChunk(callback: (data: AudioChunk) => void): () => void;
}

export interface IVideoInput extends IInputDevice {
  requestPhoto(options?: PhotoRequest): Promise<PhotoData>;
  startStream(config: StreamConfig): Promise<StreamInfo>;
  stopStream(): Promise<void>;
  onStreamStatus(callback: (status: StreamStatus) => void): () => void;
}

// ============================================
// AIプロバイダーインターフェース
// ============================================

export interface IAIProvider {
  getName(): string;
  isAvailable(): Promise<boolean>;
}

export interface ITranscriptionProvider extends IAIProvider {
  transcribe(audio: AudioChunk[]): Promise<EnhancedTranscription>;
  transcribeStream(audioStream: AsyncIterable<AudioChunk>): AsyncIterable<TranscriptionData>;
}

export interface ISpeakerDiarizationProvider extends IAIProvider {
  diarize(audio: AudioChunk[], transcription: TranscriptionData[]): Promise<EnhancedTranscription>;
}

export interface IVisionProvider extends IAIProvider {
  analyzeImage(image: Buffer): Promise<ImageAnalysis>;
  analyzeBatch(images: Buffer[]): Promise<ImageAnalysis[]>;
}

export interface ILLMProvider extends IAIProvider {
  generate(prompt: string, context?: any): Promise<string>;
  generateStructured<T>(prompt: string, schema: any, context?: any): Promise<T>;
}

// ============================================
// ストレージインターフェース
// ============================================

export interface IStorage {
  getType(): string;
  upload(key: string, data: Buffer, metadata?: Record<string, string>): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}

// ============================================
// データベースインターフェース
// ============================================

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface ISessionRepository {
  create(session: Omit<SessionData, 'sessionId'>): Promise<SessionData>;
  findById(sessionId: string): Promise<SessionData | null>;
  update(sessionId: string, data: Partial<SessionData>): Promise<SessionData>;
  delete(sessionId: string): Promise<void>;
  findByUserId(userId: string): Promise<SessionData[]>;
}

export interface ITranscriptionRepository {
  save(sessionId: string, transcription: TranscriptionData): Promise<void>;
  findBySessionId(sessionId: string): Promise<TranscriptionData[]>;
  findByTimeRange(sessionId: string, start: Date, end: Date): Promise<TranscriptionData[]>;
}

export interface IPhotoRepository {
  save(sessionId: string, photo: PhotoData): Promise<void>;
  findBySessionId(sessionId: string): Promise<PhotoData[]>;
  findById(photoId: string): Promise<PhotoData | null>;
}

// ============================================
// Vector DBインターフェース
// ============================================

export interface IVectorDB {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createCollection(name: string, dimension: number): Promise<void>;
  deleteCollection(name: string): Promise<void>;
  upsert(collection: string, id: string, vector: number[], metadata: any): Promise<void>;
  search(collection: string, vector: number[], limit: number): Promise<VectorSearchResult[]>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: any;
}

// ============================================
// コンテキスト管理インターフェース
// ============================================

export interface IContextManager {
  addTranscription(transcription: TranscriptionData): void;
  addPhoto(photo: PhotoData): void;
  addLocation(location: LocationItem): void;
  getContext(timeWindowMs?: number): ContextData;
  clear(): void;
  getBuffer<T extends 'transcriptions' | 'photos' | 'locations'>(type: T): any[];
}

// ============================================
// 重要度検出インターフェース
// ============================================

export interface IImportanceDetector {
  detectImportantMoments(text: string, timestamp: Date): ImportantMoment | null;
  calculateImportance(text: string): number;
  extractKeywords(text: string): string[];
  extractEntities(text: string): string[];
}

// ============================================
// RAGインターフェース
// ============================================

export interface IRAGService {
  indexDocument(content: string, metadata: Record<string, any>): Promise<void>;
  query(query: RAGQuery): Promise<RAGResult>;
  updateIndex(): Promise<void>;
  clearIndex(): Promise<void>;
}

// ============================================
// 生成サービスインターフェース
// ============================================

export interface ISpecificationGenerator {
  generate(request: SpecificationRequest): Promise<Specification>;
}

export interface ICodeGenerator {
  generate(request: CodeGenerationRequest): Promise<GeneratedCode>;
}

export interface ISummaryGenerator {
  summarize(context: ContextData): Promise<string>;
}

// ============================================
// 外部連携インターフェース
// ============================================

export interface ISlackIntegration {
  sendMessage(notification: SlackNotification): Promise<void>;
  uploadFile(channel: string, file: Buffer, filename: string): Promise<string>;
}

export interface IGitHubIntegration {
  createPullRequest(pr: GitHubPullRequest): Promise<string>;
  createIssue(title: string, body: string): Promise<string>;
}

export interface INotionIntegration {
  createPage(page: NotionPage): Promise<string>;
  updatePage(pageId: string, properties: Record<string, any>): Promise<void>;
}

// ============================================
// ログインターフェース
// ============================================

export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

