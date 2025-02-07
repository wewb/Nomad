// 事件名称枚举
export enum EventName {
  CLICK_EVENT = 'click_event',
  PAGE_VIEW_EVENT = 'page_view_event',
  ERROR_EVENT = 'error_event',
  CUSTOM_EVENT = 'custom_event'
}

// SDK 初始化配置接口
export interface TrackConfig {
  projectId: string;
  apiUrl: string;  // 改为必需字段
  uploadPercent?: number; // 采样率 0-1
  maxRequestLimit?: number; // 最大并发请求数
  batchWaitTime?: number; // 批量上报等待时间(ms)
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
}

// 上报数据接口
export interface TrackData {
  eventName: EventName;
  eventParams: EventParams;
  commonParams: CommonParams;
  userEnvInfo: UserEnvInfo;
  projectId: string;
} 