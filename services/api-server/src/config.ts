/**
 * Configuration Management
 * 環境変数から設定を読み込み
 */

import { config as loadEnv } from 'dotenv';
import type { InputDeviceType } from '@realworld-agent/shared';

// .envファイルを読み込み
loadEnv();

interface Config {
  env: string;
  server: {
    port: number;
    host: string;
    websocketPort: number;
  };
  device: {
    type: InputDeviceType;
  };
  mentra: {
    apiKey: string;
    packageName: string;
    appName: string;
  };
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  storage: {
    provider: 's3' | 'r2' | 'local';
    s3?: {
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
    };
    local?: {
      path: string;
    };
  };
  ai: {
    provider: 'modal' | 'replicate' | 'runpod';
    primaryLlmProvider: 'openai' | 'anthropic';
    enableLlmFallback: boolean;
    modal?: {
      tokenId: string;
      tokenSecret: string;
      apiUrl: string;
    };
    openai: {
      apiKey: string;
      model: string;
    };
    anthropic: {
      apiKey: string;
      model: string;
    };
  };
  vectorDb: {
    provider: 'qdrant' | 'pinecone' | 'weaviate';
    qdrant?: {
      url: string;
      apiKey?: string;
      collection: string;
    };
    pinecone?: {
      apiKey: string;
      environment: string;
      index: string;
    };
  };
  external: {
    slack?: {
      webhookUrl: string;
      botToken: string;
      channelId: string;
    };
    github?: {
      token: string;
      owner: string;
      repo: string;
    };
    notion?: {
      apiKey: string;
      databaseId: string;
    };
  };
  processing: {
    audio: {
      sampleRate: number;
      channels: number;
      language: string;
      enableSpeakerDiarization: boolean;
      minSpeakers: number;
      maxSpeakers: number;
    };
    video: {
      frameRate: number;
      keyframeInterval: number;
      sceneChangeThreshold: number;
      enableVisionAnalysis: boolean;
    };
    context: {
      windowSeconds: number;
      maxBufferSize: number;
      autoCleanup: boolean;
    };
    importance: {
      threshold: number;
      keywords: string[];
      autoCapture: boolean;
      captureCooldownSeconds: number;
    };
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  logging: {
    level: string;
    enableDebug: boolean;
    enableMetrics: boolean;
  };
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value === 'true' : defaultValue;
};

export const config: Config = {
  env: getEnv('NODE_ENV', 'development'),

  server: {
    port: getEnvNumber('API_SERVER_PORT', 3000),
    host: getEnv('API_SERVER_HOST', '0.0.0.0'),
    websocketPort: getEnvNumber('WEBSOCKET_PORT', 3001),
  },

  device: {
    type: getEnv('INPUT_DEVICE', 'webcam') as InputDeviceType,
  },

  mentra: {
    apiKey: getEnv('MENTRAOS_API_KEY', ''),
    packageName: getEnv('MENTRAOS_PACKAGE_NAME', 'com.example.realworld-agent'),
    appName: getEnv('MENTRAOS_APP_NAME', 'Realworld Agent'),
  },

  database: {
    url: getEnv('DATABASE_URL'),
  },

  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
  },

  storage: {
    provider: getEnv('STORAGE_PROVIDER', 'local') as 's3' | 'r2' | 'local',
    s3: process.env.S3_BUCKET
      ? {
          bucket: getEnv('S3_BUCKET'),
          region: getEnv('S3_REGION', 'auto'),
          accessKeyId: getEnv('S3_ACCESS_KEY_ID'),
          secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY'),
          endpoint: process.env.S3_ENDPOINT,
        }
      : undefined,
    local: {
      path: getEnv('LOCAL_STORAGE_PATH', './storage'),
    },
  },

  ai: {
    provider: getEnv('AI_PROVIDER', 'modal') as 'modal' | 'replicate' | 'runpod',
    primaryLlmProvider: getEnv('PRIMARY_LLM_PROVIDER', 'openai') as 'openai' | 'anthropic',
    enableLlmFallback: getEnvBoolean('ENABLE_LLM_FALLBACK', true),
    modal: process.env.MODAL_API_URL || process.env.MODAL_TOKEN_ID
      ? {
          tokenId: process.env.MODAL_TOKEN_ID || '',
          tokenSecret: process.env.MODAL_TOKEN_SECRET || '',
          apiUrl: getEnv('MODAL_API_URL', ''),
        }
      : undefined,
    openai: {
      apiKey: getEnv('OPENAI_API_KEY', ''),
      model: getEnv('OPENAI_MODEL', 'gpt-4o'),
    },
    anthropic: {
      apiKey: getEnv('ANTHROPIC_API_KEY', ''),
      model: getEnv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
    },
  },

  vectorDb: {
    provider: getEnv('VECTOR_DB_PROVIDER', 'qdrant') as
      | 'qdrant'
      | 'pinecone'
      | 'weaviate',
    qdrant: process.env.QDRANT_URL
      ? {
          url: getEnv('QDRANT_URL'),
          apiKey: process.env.QDRANT_API_KEY,
          collection: getEnv('QDRANT_COLLECTION', 'realworld_agent'),
        }
      : undefined,
    pinecone: process.env.PINECONE_API_KEY
      ? {
          apiKey: getEnv('PINECONE_API_KEY'),
          environment: getEnv('PINECONE_ENVIRONMENT'),
          index: getEnv('PINECONE_INDEX'),
        }
      : undefined,
  },

  external: {
    slack: process.env.SLACK_WEBHOOK_URL
      ? {
          webhookUrl: getEnv('SLACK_WEBHOOK_URL'),
          botToken: getEnv('SLACK_BOT_TOKEN', ''),
          channelId: getEnv('SLACK_CHANNEL_ID', ''),
        }
      : undefined,
    github: process.env.GITHUB_TOKEN
      ? {
          token: getEnv('GITHUB_TOKEN'),
          owner: getEnv('GITHUB_OWNER'),
          repo: getEnv('GITHUB_REPO'),
        }
      : undefined,
    notion: process.env.NOTION_API_KEY
      ? {
          apiKey: getEnv('NOTION_API_KEY'),
          databaseId: getEnv('NOTION_DATABASE_ID'),
        }
      : undefined,
  },

  processing: {
    audio: {
      sampleRate: getEnvNumber('AUDIO_SAMPLE_RATE', 16000),
      channels: getEnvNumber('AUDIO_CHANNELS', 1),
      language: getEnv('TRANSCRIPTION_LANGUAGE', 'ja'),
      enableSpeakerDiarization: getEnvBoolean('ENABLE_SPEAKER_DIARIZATION', true),
      minSpeakers: getEnvNumber('MIN_SPEAKERS', 1),
      maxSpeakers: getEnvNumber('MAX_SPEAKERS', 10),
    },
    video: {
      frameRate: getEnvNumber('VIDEO_FRAME_RATE', 30),
      keyframeInterval: getEnvNumber('KEYFRAME_INTERVAL', 5),
      sceneChangeThreshold: parseFloat(
        getEnv('SCENE_CHANGE_THRESHOLD', '0.3')
      ),
      enableVisionAnalysis: getEnvBoolean('ENABLE_VISION_ANALYSIS', true),
    },
    context: {
      windowSeconds: getEnvNumber('CONTEXT_WINDOW_SECONDS', 300),
      maxBufferSize: getEnvNumber('MAX_BUFFER_SIZE', 100),
      autoCleanup: getEnvBoolean('AUTO_CLEANUP_ENABLED', true),
    },
    importance: {
      threshold: parseFloat(getEnv('IMPORTANCE_THRESHOLD', '0.7')),
      keywords: getEnv(
        'KEYWORDS',
        '重要,問題,決定,仕様,要件,バグ,エラー,確認,TODO,修正'
      ).split(','),
      autoCapture: getEnvBoolean('AUTO_CAPTURE_ENABLED', true),
      captureCooldownSeconds: getEnvNumber('CAPTURE_COOLDOWN_SECONDS', 30),
    },
  },

  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },

  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    enableDebug: getEnvBoolean('ENABLE_DEBUG_LOGGING', false),
    enableMetrics: getEnvBoolean('ENABLE_PERFORMANCE_METRICS', true),
  },
};

