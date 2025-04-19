import {
  EventName,
  TrackConfig,
  CommonParams,
  UserEnvInfo,
  TrackData,
  SessionData,
  EventParams
} from './types.js';

class TrackPoint {
  private static instance: TrackPoint;
  private static lastPageViewTime: number = 0;
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
  private currentSession: SessionData | null = null;
  private eventQueue: Array<{
    type: 'view' | 'click' | 'scroll' | 'leave' | 'custom' | 'error' | 'visibility';
    timestamp: number;
    data: any;
  }> = [];
  private flushInterval: number = 5000; // 5秒的刷新间隔
  private flushTimer: NodeJS.Timeout | null = null;

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

  public register(config: TrackConfig): void {
    if (this.initialized) return;
    
    this.config = {
      ...config,
      uploadPercent: config.uploadPercent || 1.0,
      maxRequestLimit: config.maxRequestLimit || 5,
      batchWaitTime: config.batchWaitTime || 2000,
    };
    this.initialized = true;
    
    // 初始化会话
    this.initSession();
    this.setupActionTracking();
    this.setupErrorCapture();

    // 开始定时刷新
    this.startFlushTimer();

    // 添加初始页面访问事件
    this.addEvent('view', {
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      startTime: Date.now()
    });
  }

  private initSession(): void {
    this.currentSession = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      metrics: {
        scrollDepth: 0,
        visibleSections: {}
      },
      events: []
    };
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flushEvents(), this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (!this.currentSession || this.eventQueue.length === 0) return;

    // 将新事件添加到会话中
    this.currentSession.events.push(...this.eventQueue);
    
    // 准备发送的数据
    const eventData = {
      sessionId: this.currentSession.sessionId,
      projectId: this.config.projectId,
      type: 'session',
      data: {
        pageUrl: this.currentSession.pageUrl,
        pageTitle: this.currentSession.pageTitle,
        referrer: this.currentSession.referrer,
        startTime: this.currentSession.startTime,
        events: this.currentSession.events
      },
      userEnvInfo: this.userEnvInfo
    };

    try {
      // 发送事件数据
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        // 清空队列
        this.eventQueue = [];
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  public async sendEvent(eventName: EventName, params: EventParams): Promise<void> {
    if (!this.shouldSample() || !this.currentSession) return;

    const event = {
      type: this.getEventType(eventName),
      timestamp: Date.now(),
      data: params
    };

    // 添加到事件队列
    this.eventQueue.push(event);

    // 如果是页面离开事件，立即刷新
    if (eventName === EventName.PAGE_LEAVE_EVENT) {
      await this.flushEvents();
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    }
  }

  private setupActionTracking(): void {
    // 点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.hasAttribute('data-track-click')) {
        const action = target.getAttribute('data-track-click');
        
        // 处理搜索事件
        if (action === 'search-submit') {
          const searchInput = document.querySelector('#search-input') as HTMLInputElement;
          this.sendEvent(EventName.SEARCH_EVENT, {
            keyword: searchInput.value.trim()
          });
          return;
        }

        // 处理分享事件
        if (action?.startsWith('share-')) {
          this.sendEvent(EventName.SHARE_EVENT, {
            platform: action.replace('share-', ''),
            url: window.location.href
          });
          return;
        }

        // 处理关闭事件
        if (action === 'close-ad' && this.currentSession) {
          this.sendEvent(EventName.CLOSE_EVENT, {
            element: 'ad-card',
            timeOnPage: Date.now() - this.currentSession.startTime
          });
          return;
        }

        // 其他点击事件
        this.sendEvent(EventName.CLICK_EVENT, {
          element: action
        });
      }
    });

    // 修改页面离开事件处理
    window.addEventListener('beforeunload', async () => {
      if (!this.currentSession) return;
      
      // 计算总停留时间和时间轴
      const duration = Date.now() - this.currentSession!.startTime;
      const timeline = {
        startTime: this.currentSession!.startTime,
        endTime: Date.now(),
        totalDuration: duration,
        events: this.currentSession!.events?.map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          timeSinceStart: event.timestamp - this.currentSession!.startTime
        })) || []
      };

      // 添加离开事件到会话
      this.currentSession.events.push({
        type: 'leave',
        timestamp: Date.now(),
        data: { duration, timeline }
      });

      // 发送完整会话数据
      const trackData: TrackData = {
        type: 'session',
        data: {
          pageUrl: this.currentSession.pageUrl,
          pageTitle: this.currentSession.pageTitle,
          referrer: this.currentSession.referrer,
          events: this.currentSession.events
        },
        userEnvInfo: this.userEnvInfo,
        projectId: this.config.projectId
      };

      try {
        // 直接发送最终数据，不使用队列
        await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trackData)
        });
      } catch (error) {
        console.error('Failed to send final session data:', error);
      }

      // 清理定时器
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    });
  }

  private addEvent(type: 'view' | 'click' | 'scroll' | 'leave' | 'custom' | 'error', data: any): void {
    if (!this.currentSession) return;

    const event = {
      type,
      timestamp: Date.now(),
      data
    };

    this.currentSession.events.push(event);
    this.config.onActionRecorded?.(event);
  }

  public addCommonParams(params: CommonParams): void {
    this.commonParams = {
      ...this.commonParams,
      ...params
    };
  }

  private collectUserEnvInfo(): UserEnvInfo {
    // 获取或生成 UID
    const uid = this.getUserId();
    
    return {
      browserName: 'Chrome', // 简化示例，实际应该检测
      browserVersion: '1.0',
      osName: 'Windows',
      osVersion: '10',
      deviceType: 'Desktop',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      languageRaw: navigator.languages.join(','),
      referrer: document.referrer,
      pageTitle: document.title,
      uid: uid // 添加 UID
    };
  }

  private generateUUID(): string {
    const crypto = window.crypto || (globalThis as any).crypto;
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40; // Set version to 4
    array[8] = (array[8] & 0x3f) | 0x80; // Set variant to 10
    return Array.from(array)
      .map((b, i) => (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getUserId(): string {
    // 尝试从 localStorage 获取已存在的 UID
    let uid = localStorage.getItem('track_uid');
    
    // 如果不存在，则生成新的 UID 并存储
    if (!uid) {
      uid = this.generateUUID();
      localStorage.setItem('track_uid', uid);
    }
    
    return uid;
  }

  private setupErrorCapture(): void {
    window.addEventListener('error', (event) => {
      // 使用 sendEvent 而不是直接 addEvent
      this.sendEvent(EventName.ERROR_EVENT, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });
  }

  private shouldSample(): boolean {
    return Math.random() < (this.config.uploadPercent || 1);
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    // 检查是否达到最大并发请求限制
    if (this.activeRequests >= (this.config.maxRequestLimit || 5)) {
      console.log('Reached max request limit, waiting...');
      this.isProcessingQueue = false;
      return;
    }
    
    // 从队列中取出一批事件
    const batch = this.requestQueue.splice(0, Math.min(20, this.requestQueue.length));
    
    try {
      this.activeRequests++;
      
      // 发送批量请求
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      });
      
      // 处理响应...
    } catch (error) {
      // 处理错误...
      // 如果发送失败，可以选择将事件重新加入队列
      this.requestQueue.unshift(...batch);
    } finally {
      this.activeRequests--;
      this.isProcessingQueue = false;
      
      // 如果队列中还有事件，继续处理
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  private getEventType(eventName: EventName): 'view' | 'click' | 'scroll' | 'leave' | 'custom' | 'visibility' | 'error' {
    switch (eventName) {
      case EventName.PAGE_VIEW_EVENT: return 'view';
      case EventName.CLICK_EVENT: return 'click';
      case EventName.PAGE_LEAVE_EVENT: return 'leave';
      case EventName.ERROR_EVENT: return 'error';
      case EventName.SEARCH_EVENT: return 'custom';
      case EventName.SHARE_EVENT: return 'custom';
      case EventName.CLOSE_EVENT: return 'custom';
      default: return 'custom';
    }
  }
}

export const trackPoint = TrackPoint.getInstance();
export const register = (config: TrackConfig) => trackPoint.register(config);
export const sendEvent = (eventName: EventName, params: EventParams) => trackPoint.sendEvent(eventName, params);
export const addCommonParams = (params: CommonParams) => trackPoint.addCommonParams(params); 