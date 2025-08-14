// WebSocket客户端 - 处理实时进度更新
export interface ProgressUpdate {
  type: 'progress_update' | 'completion_update' | 'error_update';
  file_id: string;
  progress?: number;
  step?: string;
  status: string;
  result?: any;
  error?: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onProgressUpdate: ((update: ProgressUpdate) => void) | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') {
    // 确保URL格式正确
    if (baseUrl.startsWith('http://')) {
      this.baseUrl = baseUrl.replace('http://', 'ws://');
    } else if (baseUrl.startsWith('https://')) {
      this.baseUrl = baseUrl.replace('https://', 'wss://');
    } else {
      this.baseUrl = `ws://${baseUrl}`;
    }
  }

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.baseUrl}/ws`);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: ProgressUpdate = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            console.log('WebSocket message type:', data.type);
            console.log('WebSocket file_id:', data.file_id);
            
            if (this.onProgressUpdate) {
              console.log('Calling progress update callback');
              this.onProgressUpdate(data);
            } else {
              console.log('No progress update callback set');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 设置进度更新回调
  onProgress(callback: (update: ProgressUpdate) => void): void {
    this.onProgressUpdate = callback;
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 创建全局WebSocket客户端实例
export const websocketClient = new WebSocketClient();
