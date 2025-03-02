import { EventName } from './types.js';
import { v4 as uuidv4 } from 'uuid';
class TrackPoint {
    constructor(projectId, endpoint) {
        this.commonParams = {};
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.activeRequests = 0;
        this.pageViewStartTime = 0;
        this.currentPageUrl = '';
        this.initialized = false;
        this.lastEventTime = {};
        this.DEBOUNCE_TIME = 500;
        this.currentSession = null;
        this.projectId = projectId;
        this.endpoint = endpoint;
        // 生成或获取用户唯一标识
        this.uid = this.getUserId();
        // 收集用户环境信息
        this.userEnvInfo = this.collectUserEnvInfo();
        this.setupErrorCapture();
    }
    static getInstance(projectId, endpoint) {
        if (!TrackPoint.instance) {
            TrackPoint.instance = new TrackPoint(projectId, endpoint);
        }
        return TrackPoint.instance;
    }
    register(config) {
        if (this.initialized)
            return;
        this.config = config;
        this.initialized = true;
        // 初始化会话
        this.initSession();
        this.setupActionTracking();
        this.setupErrorCapture();
        // 添加初始页面访问事件到会话
        if (this.currentSession) {
            const viewEvent = {
                type: 'view',
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
    initSession() {
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
    async sendEvent(eventName, params) {
        if (!this.shouldSample() || !this.currentSession)
            return;
        // 添加事件到当前会话
        const event = {
            type: this.getEventType(eventName),
            timestamp: Date.now(),
            data: params
        };
        this.currentSession.events.push(event);
        // 只在页面离开时发送完整会话数据
        if (eventName === EventName.PAGE_LEAVE_EVENT) {
            const trackData = {
                type: 'session',
                data: {
                    pageUrl: this.currentSession.pageUrl,
                    pageTitle: this.currentSession.pageTitle,
                    referrer: this.currentSession.referrer,
                    events: this.currentSession.events
                },
                userEnvInfo: this.userEnvInfo,
                projectId: this.projectId
            };
            this.requestQueue.push(trackData);
            this.processQueue();
        }
    }
    setupActionTracking() {
        // 点击事件
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.hasAttribute('data-track-click')) {
                const action = target.getAttribute('data-track-click');
                // 处理搜索事件
                if (action === 'search-submit') {
                    const searchInput = document.querySelector('#search-input');
                    this.sendEvent(EventName.SEARCH_EVENT, {
                        keyword: searchInput.value.trim()
                    });
                    return;
                }
                // 处理分享事件
                if (action === null || action === void 0 ? void 0 : action.startsWith('share-')) {
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
        // 页面离开事件
        window.addEventListener('beforeunload', () => {
            if (!this.currentSession)
                return;
            this.sendEvent(EventName.PAGE_LEAVE_EVENT, {
                duration: Date.now() - this.currentSession.startTime
            });
        });
    }
    addEvent(type, data) {
        var _a, _b;
        if (!this.currentSession)
            return;
        const event = {
            type,
            timestamp: Date.now(),
            data
        };
        this.currentSession.events.push(event);
        (_b = (_a = this.config).onActionRecorded) === null || _b === void 0 ? void 0 : _b.call(_a, event);
    }
    addCommonParams(params) {
        this.commonParams = {
            ...this.commonParams,
            ...params
        };
    }
    collectUserEnvInfo() {
        const envInfo = {
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
            uid: this.uid
        };
        return envInfo;
    }
    setupErrorCapture() {
        window.addEventListener('error', (event) => {
            var _a;
            // 使用 sendEvent 而不是直接 addEvent
            this.sendEvent(EventName.ERROR_EVENT, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: (_a = event.error) === null || _a === void 0 ? void 0 : _a.stack
            });
        });
    }
    shouldSample() {
        return Math.random() < (this.config.uploadPercent || 1);
    }
    async processQueue() {
        if (this.isProcessingQueue || !this.requestQueue.length)
            return;
        this.isProcessingQueue = true;
        try {
            const data = this.requestQueue.shift();
            if (data) {
                console.log('Sending track request:', {
                    url: this.config.apiUrl,
                    data: JSON.stringify(data, null, 2),
                    projectId: this.projectId
                });
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
            }
        }
        catch (error) {
            console.error('Failed to process queue:', error);
        }
        finally {
            this.isProcessingQueue = false;
            if (this.requestQueue.length) {
                this.processQueue();
            }
        }
    }
    getEventType(eventName) {
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
    getUserId() {
        // 尝试从 localStorage 获取已存在的 UID
        let uid = localStorage.getItem('track_uid');
        // 如果不存在，则生成新的 UID 并存储
        if (!uid) {
            uid = uuidv4();
            localStorage.setItem('track_uid', uid);
        }
        return uid;
    }
}
TrackPoint.lastPageViewTime = 0;
export const trackPoint = TrackPoint.getInstance('projectId', 'endpoint');
export const register = (config) => trackPoint.register(config);
export const sendEvent = (eventName, params) => trackPoint.sendEvent(eventName, params);
export const addCommonParams = (params) => trackPoint.addCommonParams(params);
