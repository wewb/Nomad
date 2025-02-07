import { register, sendEvent, addCommonParams, EventName } from './index';
// 初始化 SDK
register({
    projectId: 'test-project',
    uploadPercent: 1,
    apiUrl: 'http://localhost:3000/track'
});
// 添加通用参数
addCommonParams({
    platform: 'web',
    version: '1.0.0'
});
// 测试发送事件
async function test() {
    try {
        await sendEvent(EventName.CLICK_EVENT, {
            buttonId: 'test-button',
            pageUrl: 'http://localhost:3000'
        });
        console.log('Event sent successfully');
    }
    catch (error) {
        console.error('Failed to send event:', error);
    }
}
test();
