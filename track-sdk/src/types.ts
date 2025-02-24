// 事件名称枚举
export enum EventName {
  CLICK_EVENT = 'click_event',
  PAGE_VIEW_EVENT = 'page_view_event',
  PAGE_LEAVE_EVENT = 'page_leave_event',
  ERROR_EVENT = 'error_event',
  SEARCH_EVENT = 'search_event',
  SHARE_EVENT = 'share_event',
  CLOSE_EVENT = 'close_event'
}

// SDK 初始化配置接口
export interface TrackConfig {
  projectId: string;
  apiUrl: string;
  uploadPercent?: number;
  maxRequestLimit?: number;
  batchWaitTime?: number;
  onActionRecorded?: (action: {
    type: 'view' | 'click' | 'scroll' | 'leave' | 'custom' | 'visibility' | 'error';
    timestamp: number;
    data: any;
  }) => void;
  onSessionEnd?: (session: SessionData) => void;
}

// 通用参数接口
export interface CommonParams {
  [key: string]: any;
}

// 事件参数接口
export interface EventParams {
  [key: string]: any;
}

// 用户环境信息接口
export interface UserEnvInfo {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: string;
  screenResolution: string;
  language: string;
  timezone: string;
  uid?: string;
  timestamp: number;
  userAgent: string;          // 原始 UA
  languageRaw: string;        // 原始语言设置
  ipAddress?: string;         // IP 地址
  location?: {               // 地理位置信息
    country?: string;
    region?: string;
    city?: string;
  };
  referrer: string;          // 来源页面
  pageTitle: string;         // 页面标题
}

// 新增页面停留时间跟踪
export interface PageViewParams extends EventParams {
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// 上报数据接口
export interface TrackData {
  type: string;
  data: any;
  userEnvInfo: UserEnvInfo;
  projectId: string;
}

// 会话数据接口
export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  metrics: {
    duration?: number;
    scrollDepth: number;
    visibleSections: Record<string, number>;
  };
  events: Array<{
    type: 'view' | 'click' | 'scroll' | 'leave' | 'custom' | 'visibility' | 'error';
    timestamp: number;
    data: any;
  }>;
} 