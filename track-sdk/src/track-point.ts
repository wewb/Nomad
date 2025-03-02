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
    
    this.config = config;
    this.initialized = true;
    
    // 初始化会话
    this.initSession();
    this.setupActionTracking();
    this.setupErrorCapture();

    // 添加初始页面访问事件到会话
    if (this.currentSession) {
      const viewEvent = {
        type: 'view' as const,
        timestamp: Date.now(),
        data: {
          pageUrl: window.location.href,
          pageTitle: document.title,
          referrer: document.referrer,
          startTime: Date.now()
        }
      };
      this.currentSession.events.push(viewEvent);
    }
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

  public async sendEvent(eventName: EventName, params: EventParams): Promise<void> {
    if (!this.shouldSample() || !this.currentSession) return;

    // 添加事件到当前会话
    const event = {
      type: this.getEventType(eventName),
      timestamp: Date.now(),
      data: params
    };
    
    this.currentSession.events.push(event);
    
    // 只在页面离开时发送完整会话数据
    if (eventName === EventName.PAGE_LEAVE_EVENT) {
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

      this.requestQueue.push(trackData);
      this.processQueue();
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
        if (action === 'close-ad') {
          this.sendEvent(EventName.CLOSE_EVENT, {
            element: 'ad-card',
            timeOnPage: Date.now() - this.currentSession!.startTime
          });
          return;
        }

        // 其他点击事件
        this.sendEvent(EventName.CLICK_EVENT, {
          element: action
        });
      }
    });

    // 页面离开事件
    window.addEventListener('beforeunload', () => {
      if (!this.currentSession) return;
      this.sendEvent(EventName.PAGE_LEAVE_EVENT, {
        duration: Date.now() - this.currentSession.startTime
      });
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.requestQueue.length) {
      console.log('Queue processing skipped:', { 
        isProcessing: this.isProcessingQueue, 
        queueLength: this.requestQueue.length 
      });
      return;
    }
    
    this.isProcessingQueue = true;
    console.log('Starting to process queue, items:', this.requestQueue.length);
    
    try {
      const data = this.requestQueue.shift();
      if (data) {
        console.log('Sending track request to:', this.config.apiUrl);
        console.log('Request data:', JSON.stringify(data).substring(0, 500));
        
        try {
          const response = await fetch(this.config.apiUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Origin': window.location.origin
            },
            body: JSON.stringify(data)
          });

          const responseText = await response.text();
          console.log('Server response:', {
            status: response.status,
            text: responseText
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}: ${responseText}`);
          }
        } catch (fetchError) {
          console.error('Network error during fetch:', fetchError);
          // 重新将数据放回队列以便稍后重试
          this.requestQueue.unshift(data);
        }
      }
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      this.isProcessingQueue = false;
      console.log('Queue processing finished, remaining items:', this.requestQueue.length);
      
      if (this.requestQueue.length) {
        console.log('Processing next item in queue...');
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