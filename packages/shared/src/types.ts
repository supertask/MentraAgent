/**
 * 共通型定義
 */

// ============================================
// 入力デバイス関連
// ============================================

export type InputDeviceType = 'mentra' | 'webcam';

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSpeaker: boolean;
  hasDisplay: boolean;
  hasLocation: boolean;
}

// ============================================
// 音声関連
// ============================================

export interface TranscriptionData {
  text: string;
  isFinal: boolean;
  timestamp: Date;
  confidence?: number;
  language?: string;
}

export interface EnhancedTranscription extends TranscriptionData {
  words: WordTimestamp[];
  speakers?: SpeakerSegment[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface VoiceActivityData {
  status: boolean | 'true' | 'false';
  timestamp: Date;
}

export interface AudioChunk {
  data: Buffer;
  timestamp: Date;
  sampleRate: number;
  channels: number;
}

// ============================================
// 映像関連
// ============================================

export interface PhotoData {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  requestId: string;
  size: number;
  timestamp: Date;
}

export interface PhotoRequest {
  size?: 'small' | 'medium' | 'large';
  saveToGallery?: boolean;
}

export interface VideoFrame {
  buffer: Buffer;
  timestamp: Date;
  frameNumber: number;
  width: number;
  height: number;
}

export interface KeyFrame extends VideoFrame {
  importance: number;
  reason: string;
}

export interface SceneChange {
  timestamp: Date;
  frameNumber: number;
  similarity: number;
  previousFrame: Buffer;
  currentFrame: Buffer;
}

// ============================================
// ストリーミング関連
// ============================================

export interface StreamConfig {
  quality: '720p' | '1080p';
  enableWebRTC?: boolean;
  restreamDestinations?: RestreamDestination[];
}

export interface RestreamDestination {
  url: string;
  name: string;
}

export interface StreamInfo {
  type: 'managed' | 'unmanaged';
  hlsUrl?: string;
  dashUrl?: string;
  webrtcUrl?: string;
  previewUrl?: string;
}

export interface StreamStatus {
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
  message?: string;
  stats?: StreamStats;
}

export interface StreamStats {
  fps: number;
  bitrate: number;
  droppedFrames: number;
  uptime: number;
}

// ============================================
// コンテキスト管理
// ============================================

export interface ContextData {
  transcriptions: TranscriptionItem[];
  photos: PhotoItem[];
  locations: LocationItem[];
  timeRange: TimeRange;
}

export interface TranscriptionItem {
  text: string;
  timestamp: Date;
  speaker?: string;
  importance?: number;
}

export interface PhotoItem {
  photo: PhotoData;
  timestamp: Date;
  relatedText?: string;
  analysis?: ImageAnalysis;
}

export interface LocationItem {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// ============================================
// 重要度検出
// ============================================

export interface ImportantMoment {
  timestamp: Date;
  text?: string;
  reason: string;
  importance: number;
  relatedPhoto?: PhotoData;
  keywords?: string[];
  entities?: string[];
}

export interface KeywordMatch {
  keyword: string;
  context: string;
  position: number;
}

export interface EntityExtraction {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'TIME' | 'MONEY' | 'OTHER';
  confidence: number;
}

// ============================================
// AI処理関連
// ============================================

export interface ImageAnalysis {
  description: string;
  objects: DetectedObject[];
  text?: string;
  scene?: string;
  confidence: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RAGQuery {
  query: string;
  context: ContextData;
  maxResults?: number;
  threshold?: number;
}

export interface RAGResult {
  documents: RetrievedDocument[];
  relevanceScore: number;
}

export interface RetrievedDocument {
  content: string;
  source: string;
  score: number;
  metadata: Record<string, any>;
}

// ============================================
// 生成関連
// ============================================

export interface SpecificationRequest {
  context: ContextData;
  template?: string;
  language?: string;
}

export interface Specification {
  title: string;
  summary: string;
  requirements: Requirement[];
  technicalDetails: TechnicalDetail[];
  images: string[];
  metadata: Record<string, any>;
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface TechnicalDetail {
  section: string;
  content: string;
  code?: CodeSnippet[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

export interface CodeGenerationRequest {
  specification: string;
  language: string;
  framework?: string;
}

export interface GeneratedCode {
  files: GeneratedFile[];
  dependencies: string[];
  instructions: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

// ============================================
// セッション管理
// ============================================

export interface SessionData {
  sessionId: string;
  userId: string;
  deviceType: InputDeviceType;
  startTime: Date;
  endTime?: Date;
  context: ContextData;
  status: 'active' | 'paused' | 'completed' | 'error';
}

export interface SessionStats {
  duration: number;
  transcriptionCount: number;
  photoCount: number;
  importantMomentCount: number;
  generatedDocumentCount: number;
}

// ============================================
// 外部連携
// ============================================

export interface SlackNotification {
  channel: string;
  text: string;
  attachments?: SlackAttachment[];
  threadTs?: string;
}

export interface SlackAttachment {
  title: string;
  text: string;
  color?: string;
  fields?: SlackField[];
  imageUrl?: string;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface GitHubPullRequest {
  title: string;
  body: string;
  head: string;
  base: string;
  files: GeneratedFile[];
}

export interface NotionPage {
  parent: { database_id: string };
  properties: Record<string, any>;
  children: NotionBlock[];
}

export interface NotionBlock {
  type: string;
  [key: string]: any;
}

// ============================================
// エラー処理
// ============================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  sessionId?: string;
}

export type ErrorCode =
  | 'DEVICE_ERROR'
  | 'TRANSCRIPTION_ERROR'
  | 'PHOTO_ERROR'
  | 'STREAM_ERROR'
  | 'AI_PROCESSING_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'UNKNOWN_ERROR';

