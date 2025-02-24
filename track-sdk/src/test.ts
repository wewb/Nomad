import { register, sendEvent, EventName } from './index';

// 初始化 SDK
register({
  projectId: 'test-project',
  apiUrl: 'http://localhost:3000/track'
});

// 测试发送事件
async function test() {
  try {
    await sendEvent(EventName.PAGE_VIEW_EVENT, {
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      startTime: Date.now()
    });
    console.log('Event sent successfully');
  } catch (error) {
    console.error('Failed to send event:', error);
  }
}

test(); 