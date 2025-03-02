// 创建一个专门的测试脚本
import { register, sendEvent, EventName } from '../dist/index.js';

// 导出这些函数供 HTML 使用
window.trackSDK = {
  register,
  sendEvent,
  EventName
};

console.log('Track SDK test script loaded'); 