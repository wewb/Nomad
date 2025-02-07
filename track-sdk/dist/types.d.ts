export declare enum EventName {
    CLICK_EVENT = "click_event",
    PAGE_VIEW_EVENT = "page_view_event",
    ERROR_EVENT = "error_event",
    CUSTOM_EVENT = "custom_event"
}
export interface TrackConfig {
    projectId: string;
    apiUrl: string;
    uploadPercent?: number;
    maxRequestLimit?: number;
    batchWaitTime?: number;
}
export interface CommonParams {
    [key: string]: any;
}
export interface EventParams {
    [key: string]: any;
}
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
export interface TrackData {
    eventName: EventName;
    eventParams: EventParams;
    commonParams: CommonParams;
    userEnvInfo: UserEnvInfo;
    projectId: string;
}
