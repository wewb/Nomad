export interface Config {
  projectId: string
  uploadPercent?: number
  maxRequests?: number
  queueWaitTime?: number
}

export interface CommonParams {
  [key: string]: any
}

export interface EventParams {
  [key: string]: any
}

export interface UserInfo {
  browser: string
  browserVersion: string
  os: string
  deviceType: string
  screenResolution: string
  language: string
  timezone: string
}

export interface EventData {
  event_name: string
  event_params: EventParams
  common_params: CommonParams
  user_info: UserInfo
  timestamp: number
  project_id: string
} 