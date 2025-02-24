export declare enum EventName {
    CLICK_EVENT = "click_event",
    PAGE_VIEW_EVENT = "page_view_event",
    PAGE_LEAVE_EVENT = "page_leave_event",
    ERROR_EVENT = "error_event",
    SEARCH_EVENT = "search_event",
    SHARE_EVENT = "share_event",
    CLOSE_EVENT = "close_event"
}
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
    userAgent: string;
    languageRaw: string;
    ipAddress?: string;
    location?: {
        country?: string;
        region?: string;
        city?: string;
    };
    referrer: string;
    pageTitle: string;
}
export interface PageViewParams extends EventParams {
    pageUrl: string;
    pageTitle: string;
    referrer: string;
    startTime: number;
    endTime?: number;
    duration?: number;
}
export interface TrackData {
    type: string;
    data: any;
    userEnvInfo: UserEnvInfo;
    projectId: string;
}
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
