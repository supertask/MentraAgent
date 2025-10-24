/**
 * Web Client Application
 * Webカメラからの音声・映像をAPIサーバーに送信
 */

// 設定
const API_BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// DOM要素
const videoPreview = document.getElementById('video-preview') as HTMLVideoElement;
const videoOverlay = document.getElementById('video-overlay') as HTMLDivElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const stopButton = document.getElementById('stop-button') as HTMLButtonElement;
const captureButton = document.getElementById('capture-button') as HTMLButtonElement;
const generateSpecButton = document.getElementById('generate-spec-button') as HTMLButtonElement;

const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement;
const sessionIdEl = document.getElementById('session-id') as HTMLSpanElement;
const recordingTimeEl = document.getElementById('recording-time') as HTMLSpanElement;

const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
const microphoneSelect = document.getElementById('microphone-select') as HTMLSelectElement;

const transcriptionOutput = document.getElementById('transcription-output') as HTMLDivElement;
const importantMoments = document.getElementById('important-moments') as HTMLDivElement;
const systemLog = document.getElementById('system-log') as HTMLDivElement;

// グローバル状態
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let websocket: WebSocket | null = null;
let sessionId: string | null = null;
let recordingStartTime: number | null = null;
let recordingInterval: number | null = null;
let audioContext: AudioContext | null = null;

// 初期化
async function init() {
  addLog('アプリケーションを初期化しています...', 'info');
  
  try {
    // デバイス一覧を取得
    await loadDevices();
    addLog('デバイス一覧を読み込みました', 'success');
    
    // イベントリスナーの設定
    setupEventListeners();
    addLog('準備完了', 'success');
  } catch (error) {
    addLog(`初期化エラー: ${error}`, 'error');
    console.error(error);
  }
}

// デバイス一覧を読み込む
async function loadDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');
    
    // カメラ選択
    cameraSelect.innerHTML = '';
    videoDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `カメラ ${cameraSelect.options.length + 1}`;
      cameraSelect.appendChild(option);
    });
    cameraSelect.disabled = false;
    
    // マイク選択
    microphoneSelect.innerHTML = '';
    audioDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `マイク ${microphoneSelect.options.length + 1}`;
      microphoneSelect.appendChild(option);
    });
    microphoneSelect.disabled = false;
  } catch (error) {
    addLog(`デバイス取得エラー: ${error}`, 'error');
    throw error;
  }
}

// イベントリスナーの設定
function setupEventListeners() {
  startButton.addEventListener('click', startSession);
  stopButton.addEventListener('click', stopSession);
  captureButton.addEventListener('click', capturePhoto);
  generateSpecButton.addEventListener('click', generateSpecification);
}

// セッション開始
async function startSession() {
  addLog('セッションを開始しています...', 'info');
  
  try {
    // メディアストリームを取得
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: {
        deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    };
    
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoPreview.srcObject = mediaStream;
    
    // ビデオオーバーレイを非表示
    videoOverlay.classList.add('hidden');
    
    addLog('カメラとマイクにアクセスしました', 'success');
    
    // APIサーバーに接続
    await connectToServer();
    
    // 音声認識の開始
    await startAudioProcessing();
    
    // UIの更新
    startButton.disabled = true;
    stopButton.disabled = false;
    captureButton.disabled = false;
    generateSpecButton.disabled = false;
    cameraSelect.disabled = true;
    microphoneSelect.disabled = true;
    
    // 録画時間の更新
    recordingStartTime = Date.now();
    recordingInterval = window.setInterval(updateRecordingTime, 1000);
    
    addLog('セッション開始', 'success');
  } catch (error) {
    addLog(`セッション開始エラー: ${error}`, 'error');
    console.error(error);
    await stopSession();
  }
}

// サーバーに接続
async function connectToServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // WebSocket接続
      websocket = new WebSocket(`${WS_URL}/api/device/webcam/stream`);
      
      websocket.onopen = () => {
        updateConnectionStatus(true);
        addLog('サーバーに接続しました', 'success');
        
        // セッションID生成（簡易版）
        sessionId = `session-${Date.now()}`;
        sessionIdEl.textContent = sessionId.substring(0, 16) + '...';
        
        resolve();
      };
      
      websocket.onmessage = (event) => {
        handleServerMessage(event.data);
      };
      
      websocket.onerror = (error) => {
        addLog(`WebSocketエラー`, 'error');
        console.error(error);
        updateConnectionStatus(false);
      };
      
      websocket.onclose = () => {
        addLog('サーバーから切断されました', 'warning');
        updateConnectionStatus(false);
      };
      
      // タイムアウト
      setTimeout(() => {
        if (websocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('接続タイムアウト'));
        }
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
}

// 音声処理の開始
async function startAudioProcessing() {
  if (!mediaStream) return;
  
  try {
    // AudioContextの作成
    audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    // Web Speech APIで文字起こし（ブラウザ内）
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';
    
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      displayTranscription(transcript, isFinal);
      
      // サーバーに送信
      if (isFinal && websocket?.readyState === WebSocket.OPEN) {
        sendToServer({
          type: 'transcription',
          data: {
            text: transcript,
            timestamp: new Date().toISOString(),
            isFinal: true,
          },
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      addLog(`音声認識エラー: ${event.error}`, 'error');
    };
    
    recognition.start();
    addLog('音声認識を開始しました', 'success');
  } catch (error) {
    addLog(`音声処理エラー: ${error}`, 'warning');
    console.error(error);
  }
}

// サーバーにメッセージを送信
function sendToServer(message: any) {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  }
}

// サーバーからのメッセージを処理
function handleServerMessage(data: string) {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'transcription':
        displayTranscription(message.data.text, message.data.isFinal);
        break;
      case 'important_moment':
        displayImportantMoment(message.data);
        break;
      case 'error':
        addLog(`サーバーエラー: ${message.data.message}`, 'error');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Failed to parse server message:', error);
  }
}

// 文字起こしを表示
function displayTranscription(text: string, isFinal: boolean) {
  if (transcriptionOutput.querySelector('.placeholder')) {
    transcriptionOutput.innerHTML = '';
  }
  
  const entry = document.createElement('div');
  entry.className = 'transcription-entry';
  
  const meta = document.createElement('div');
  meta.className = 'transcription-meta';
  meta.innerHTML = `
    <span>${new Date().toLocaleTimeString()}</span>
    <span>${isFinal ? '確定' : '認識中...'}</span>
  `;
  
  const textEl = document.createElement('div');
  textEl.className = 'transcription-text';
  textEl.textContent = text;
  
  entry.appendChild(meta);
  entry.appendChild(textEl);
  
  if (isFinal) {
    transcriptionOutput.insertBefore(entry, transcriptionOutput.firstChild);
    
    // 最大表示数を制限
    while (transcriptionOutput.children.length > 20) {
      transcriptionOutput.removeChild(transcriptionOutput.lastChild!);
    }
  }
}

// 重要箇所を表示
function displayImportantMoment(data: any) {
  if (importantMoments.querySelector('.placeholder')) {
    importantMoments.innerHTML = '';
  }
  
  const moment = document.createElement('div');
  moment.className = 'important-moment';
  moment.innerHTML = `
    <div class="moment-header">
      <span class="moment-reason">${data.reason}</span>
      <span class="moment-time">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="moment-text">${data.text || ''}</div>
    ${data.keywords && data.keywords.length > 0 ? `
      <div class="moment-keywords">
        ${data.keywords.map((kw: string) => `<span class="keyword-tag">${kw}</span>`).join('')}
      </div>
    ` : ''}
  `;
  
  importantMoments.insertBefore(moment, importantMoments.firstChild);
}

// 写真を撮影
async function capturePhoto() {
  if (!videoPreview) return;
  
  addLog('写真を撮影しています...', 'info');
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoPreview, 0, 0);
    
    // Blobに変換
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
    });
    
    // サーバーに送信
    const formData = new FormData();
    formData.append('file', blob, `capture-${Date.now()}.jpg`);
    formData.append('sessionId', sessionId || '');
    
    const response = await fetch(`${API_BASE_URL}/api/device/photo`, {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      addLog('写真を保存しました', 'success');
    } else {
      addLog('写真の保存に失敗しました', 'error');
    }
  } catch (error) {
    addLog(`写真撮影エラー: ${error}`, 'error');
    console.error(error);
  }
}

// 仕様書生成
async function generateSpecification() {
  addLog('仕様書を生成しています...', 'info');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/processing/generate-spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    
    if (response.ok) {
      const data = await response.json();
      addLog(`仕様書を生成しました: ${data.title}`, 'success');
    } else {
      addLog('仕様書の生成に失敗しました', 'error');
    }
  } catch (error) {
    addLog(`仕様書生成エラー: ${error}`, 'error');
    console.error(error);
  }
}

// セッション停止
async function stopSession() {
  addLog('セッションを停止しています...', 'info');
  
  // 録画時間更新の停止
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  
  // WebSocket切断
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  
  // メディアストリーム停止
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  
  // AudioContext停止
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }
  
  // UIの更新
  videoPreview.srcObject = null;
  videoOverlay.classList.remove('hidden');
  startButton.disabled = false;
  stopButton.disabled = true;
  captureButton.disabled = true;
  generateSpecButton.disabled = true;
  cameraSelect.disabled = false;
  microphoneSelect.disabled = false;
  
  updateConnectionStatus(false);
  sessionIdEl.textContent = '-';
  recordingTimeEl.textContent = '00:00:00';
  
  addLog('セッション終了', 'info');
}

// 録画時間を更新
function updateRecordingTime() {
  if (!recordingStartTime) return;
  
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  recordingTimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 接続状態を更新
function updateConnectionStatus(connected: boolean) {
  connectionStatus.textContent = connected ? '接続中' : '未接続';
  connectionStatus.className = `status-value ${connected ? 'connected' : 'disconnected'}`;
}

// ログを追加
function addLog(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const entry = document.createElement('p');
  entry.className = `log-${level}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  systemLog.appendChild(entry);
  systemLog.scrollTop = systemLog.scrollHeight;
  
  // 最大ログ数を制限
  while (systemLog.children.length > 50) {
    systemLog.removeChild(systemLog.firstChild!);
  }
}

// アプリケーション起動
init();

