import { sendEvent as _sendEvent } from './track-point.js';
import { EventName } from './types.js';
// 重新导出所需的内容
export { trackPoint, register, addCommonParams } from './track-point.js';
export { EventName } from './types.js';
// 重新导出 sendEvent
export const sendEvent = _sendEvent;
// 添加错误捕获和上报功能
export function initErrorTracking(projectId) {
    // 捕获未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
        var _a, _b;
        const error = {
            type: 'unhandledrejection',
            message: ((_a = event.reason) === null || _a === void 0 ? void 0 : _a.message) || 'Promise rejection',
            stack: (_b = event.reason) === null || _b === void 0 ? void 0 : _b.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        _sendEvent(EventName.ERROR_EVENT, { projectId, ...error });
    });
    // 捕获全局错误
    window.addEventListener('error', (event) => {
        // 忽略资源加载错误，只关注 JavaScript 错误
        if (event.error) {
            const error = {
                type: 'error',
                message: event.error.message || event.message,
                stack: event.error.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
            _sendEvent(EventName.ERROR_EVENT, { projectId, ...error });
        }
    }, true);
    console.log('Error tracking initialized for project:', projectId);
}
