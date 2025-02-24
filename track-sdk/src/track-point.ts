import {
  EventName,
  TrackConfig,
  CommonParams,
  EventParams,
  UserEnvInfo,
  TrackData
} from './types.js';

class TrackPoint {
  private static instance: TrackPoint;
  private static lastPageViewTime: number = 0;  // 静态变量存储最后一次页面访问时间
  private config!: TrackConfig;
  private commonParams: CommonParams = {};
  private userEnvInfo: UserEnvInfo;
  private requestQueue: TrackData[] = [];
  private isProcessingQueue = false;
  private activeRequests = 0;
  private pageViewStartTime: number = 0;
  private currentPageUrl: string = '';
  private initialized: boolean = false;
  private lastEventTime: Record<string, number> = {};
  private readonly DEBOUNCE_TIME = 500;

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
    if (this.initialized) {
      console.warn('SDK already initialized');
      return;
    }

    this.config = {
      uploadPercent: 1,
      maxRequestLimit: 10,
      batchWaitTime: 1000,
      ...config
    };

    this.setupErrorCapture();
    this.setupPageTracking();
    this.initialized = true;
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

    // 检查是否是重复的页面访问事件
    if (eventName === EventName.PAGE_VIEW_EVENT) {
      const now = Date.now();
      const timeSinceLastView = now - TrackPoint.lastPageViewTime;
      console.log(`Time since last page view: ${timeSinceLastView}ms`);
      
      if (timeSinceLastView < this.DEBOUNCE_TIME) {
        console.log(`Skipping duplicate page view event (${timeSinceLastView}ms < ${this.DEBOUNCE_TIME}ms)`);
        return;
      }
      
      TrackPoint.lastPageViewTime = now;
    }

    const trackData: TrackData = {
      eventName,
      eventParams: {
        ...params,
        _timestamp: Date.now()
      },
      commonParams: this.commonParams,
      userEnvInfo: this.userEnvInfo,
      projectId: this.config.projectId
    };

    this.requestQueue.push(trackData);
    await this.processQueue();
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
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      languageRaw: navigator.languages ? navigator.languages.join(',') : navigator.language,
      referrer: document.referrer,
      pageTitle: document.title,
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

    try {
      while (this.requestQueue.length > 0) {
        const data = this.requestQueue[0]; // 查看队列头部但不移除
        if (data) {
          await this.sendToServer(data);
          this.requestQueue.shift(); // 发送成功后移除
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 发送数据到服务器
  private async sendToServer(data: TrackData): Promise<void> {
    console.log('Sending data to server:', data);
    const maxRetries = 3;
    let retryCount = 0;
    
    const apiUrl = this.config?.apiUrl || 'https://api.track-point.example.com/track';
    console.log('Using API URL:', apiUrl);
    
    if (!apiUrl) {
      throw new Error('API URL is not configured');
    }

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        console.log('Server response:', response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      } catch (error) {
        console.error('Request failed:', error);
        retryCount++;
        if (retryCount === maxRetries) {
          this.saveToLocalStorage(data);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  private saveToLocalStorage(data: TrackData): void {
    const key = `track_${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private processPendingEvents(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('track_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          this.requestQueue.push(data);
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to process pending event:', e);
        }
      }
    }
  }

  private setupPageTracking(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        await this.initPageTracking();
      });
    } else {
      // 已经加载完成，直接初始化
      void this.initPageTracking();
    }
  }

  private async initPageTracking(): Promise<void> {
    this.pageViewStartTime = Date.now();
    this.currentPageUrl = window.location.href;

    // 等待首次页面加载事件完成
    await this.sendEvent(EventName.PAGE_VIEW_EVENT, {
      pageUrl: this.currentPageUrl,
      pageTitle: document.title,
      referrer: document.referrer,
      startTime: this.pageViewStartTime,
      isInitialPageLoad: true  // 添加标记以区分初始加载
    });

    // 页面离开事件
    window.addEventListener('beforeunload', () => {
      const endTime = Date.now();
      const duration = endTime - this.pageViewStartTime;
      
      this.sendEvent(EventName.PAGE_LEAVE_EVENT, {
        pageUrl: this.currentPageUrl,
        pageTitle: document.title,
        startTime: this.pageViewStartTime,
        endTime: endTime,
        duration: duration
      });
    });

    // 对于单页应用，使用 history API 监听路由变化
    window.addEventListener('popstate', () => this.handleUrlChange());
    
    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };

    window.addEventListener('locationchange', () => this.handleUrlChange());
  }

  private handleUrlChange(): void {
    const newUrl = window.location.href;
    if (newUrl !== this.currentPageUrl) {
      // 记录上一个页面的停留时间
      const endTime = Date.now();
      const duration = endTime - this.pageViewStartTime;
      
      this.sendEvent(EventName.PAGE_LEAVE_EVENT, {
        pageUrl: this.currentPageUrl,
        pageTitle: document.title,
        startTime: this.pageViewStartTime,
        endTime: endTime,
        duration: duration
      });

      // 开始记录新页面
      this.pageViewStartTime = Date.now();
      const oldUrl = this.currentPageUrl;
      this.currentPageUrl = newUrl;
      
      this.sendEvent(EventName.PAGE_VIEW_EVENT, {
        pageUrl: newUrl,
        pageTitle: document.title,
        referrer: oldUrl,
        startTime: this.pageViewStartTime
      });
    }
  }
}

// 导出单例实例
export const trackPoint = TrackPoint.getInstance();

// 导出便捷方法
export const register = (config: TrackConfig) => trackPoint.register(config);
export const sendEvent = (eventName: EventName, params: EventParams) => trackPoint.sendEvent(eventName, params);
export const addCommonParams = (params: CommonParams) => trackPoint.addCommonParams(params); 