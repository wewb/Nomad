import { EventName } from './types.js';
class TrackPoint {
    constructor() {
        this.commonParams = {};
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.activeRequests = 0;
        this.userEnvInfo = this.collectUserEnvInfo();
        this.setupErrorCapture();
    }
    static getInstance() {
        if (!TrackPoint.instance) {
            TrackPoint.instance = new TrackPoint();
        }
        return TrackPoint.instance;
    }
    // 初始化配置
    register(config) {
        this.config = {
            uploadPercent: 1,
            maxRequestLimit: 10,
            batchWaitTime: 1000,
            ...config
        };
    }
    // 添加通用参数
    addCommonParams(params) {
        this.commonParams = {
            ...this.commonParams,
            ...params
        };
    }
    // 发送事件
    async sendEvent(eventName, params) {
        if (!this.shouldSample()) {
            return;
        }
        const trackData = {
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
    collectUserEnvInfo() {
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
    setupErrorCapture() {
        window.addEventListener('error', (event) => {
            var _a;
            this.sendEvent(EventName.ERROR_EVENT, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: (_a = event.error) === null || _a === void 0 ? void 0 : _a.stack
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
    shouldSample() {
        return Math.random() < (this.config.uploadPercent || 1);
    }
    // 处理上报队列
    async processQueue() {
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
                }
                catch (error) {
                    console.error('Failed to send track data:', error);
                }
                this.activeRequests--;
            }
        }
        this.isProcessingQueue = false;
    }
    // 发送数据到服务器
    async sendToServer(data) {
        var _a;
        console.log('Sending data to server:', data);
        const maxRetries = 3;
        let retryCount = 0;
        const apiUrl = ((_a = this.config) === null || _a === void 0 ? void 0 : _a.apiUrl) || 'https://api.track-point.example.com/track';
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
            }
            catch (error) {
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
    saveToLocalStorage(data) {
        const key = `track_${Date.now()}`;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        }
        catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }
    processPendingEvents() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === null || key === void 0 ? void 0 : key.startsWith('track_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '');
                    this.requestQueue.push(data);
                    localStorage.removeItem(key);
                }
                catch (e) {
                    console.error('Failed to process pending event:', e);
                }
            }
        }
    }
}
// 导出单例实例
export const trackPoint = TrackPoint.getInstance();
// 导出便捷方法
export const register = (config) => trackPoint.register(config);
export const sendEvent = (eventName, params) => trackPoint.sendEvent(eventName, params);
export const addCommonParams = (params) => trackPoint.addCommonParams(params);
