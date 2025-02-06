import {
  EventName,
  TrackConfig,
  CommonParams,
  EventParams,
  UserEnvInfo,
  TrackData
} from './types';

class TrackPoint {
  private static instance: TrackPoint;
  private config!: TrackConfig;
  private commonParams: CommonParams = {};
  private userEnvInfo: UserEnvInfo;
  private requestQueue: TrackData[] = [];
  private isProcessingQueue = false;
  private activeRequests = 0;

  private constructor() {
    this.userEnvInfo = this.collectUserEnvInfo();
    this.setupErrorCapture();
  }

  public static getInstance(): TrackPoint {
    if (!TrackPoint.instance) {
      TrackPoint.instance = new TrackPoint();
    }
    return TrackPoint.instance;
  }

  // 初始化配置
  public register(config: TrackConfig): void {
    this.config = {
      uploadPercent: 1,
      maxRequestLimit: 10,
      batchWaitTime: 1000,
      ...config
    };
  }

  // 添加通用参数
  public addCommonParams(params: CommonParams): void {
    this.commonParams = {
      ...this.commonParams,
      ...params
    };
  }

  // 发送事件
  public async sendEvent(eventName: EventName, params: EventParams): Promise<void> {
    if (!this.shouldSample()) {
      return;
    }

    const trackData: TrackData = {
      eventName,
      eventParams: params,
      commonParams: this.commonParams,
      userEnvInfo: this.userEnvInfo,
      projectId: this.config.projectId
    };

    this.requestQueue.push(trackData);
    this.processQueue();
  }

  // 收集用户环境信息
  private collectUserEnvInfo(): UserEnvInfo {
    const userAgent = navigator.userAgent;
    return {
      browserName: 'Chrome', // 示例值，需要实际解析
      browserVersion: '1.0',
      osName: 'Windows',
      osVersion: '10',
      deviceType: 'Desktop',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now()
    };
  }

  // 错误捕获设置
  private setupErrorCapture(): void {
    window.addEventListener('error', (event) => {
      this.sendEvent(EventName.ERROR_EVENT, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.sendEvent(EventName.ERROR_EVENT, {
        message: 'Unhandled Promise Rejection',
        reason: event.reason
      });
    });
  }

  // 采样判断
  private shouldSample(): boolean {
    return Math.random() < (this.config.uploadPercent || 1);
  }

  // 处理上报队列
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < (this.config.maxRequestLimit || 10)) {
      const data = this.requestQueue.shift();
      if (data) {
        this.activeRequests++;
        try {
          await this.sendToServer(data);
        } catch (error) {
          console.error('Failed to send track data:', error);
        }
        this.activeRequests--;
      }
    }

    this.isProcessingQueue = false;
  }

  // 发送数据到服务器
  private async sendToServer(data: TrackData): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.track-point.example.com/track';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }
}

// 导出单例实例
export const trackPoint = TrackPoint.getInstance();

// 导出便捷方法
export const register = (config: TrackConfig) => trackPoint.register(config);
export const sendEvent = (eventName: EventName, params: EventParams) => trackPoint.sendEvent(eventName, params);
export const addCommonParams = (params: CommonParams) => trackPoint.addCommonParams(params); 