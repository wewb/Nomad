import React, { useState } from 'react';
import { Tabs, Card, Divider } from 'tdesign-react';
import ReactMarkdown from 'react-markdown';
import { 
  AppIcon, 
  CodeIcon, 
  UserIcon, 
  BugIcon, 
  ChartIcon, 
  HelpCircleIcon 
} from 'tdesign-icons-react';
import './style.less';

const { TabPanel } = Tabs;

export function Documentation() {
  const [activeTab, setActiveTab] = useState<string | number>('overview');

  // 使用说明文档内容
  const overviewContent = `
# Track Platform 使用说明

Track Platform 是一个完整的数据追踪与分析平台，帮助您收集、分析和可视化用户行为数据。本文档将指导您如何使用平台的各项功能。

## 主要功能

- **应用管理**：创建和管理您的应用项目
- **事件追踪**：收集和查看用户行为事件
- **数据分析**：分析用户行为数据和趋势
- **错误监控**：捕获和分析前端错误
- **用户管理**：管理平台用户和权限

## 快速开始

1. 创建应用项目
2. 集成 SDK 到您的网站
3. 开始收集数据
4. 在仪表盘查看分析结果
  `;

  const sdkContent = `
# SDK 集成指南

## 安装

通过 npm 安装:

\`\`\`bash
npm install track-sdk
\`\`\`

或通过 CDN 引入:

\`\`\`html
<script type="module">
  import { register, sendEvent, EventName } from 'https://cdn.example.com/track-sdk.js';
</script>
\`\`\`

## 基本用法

### 初始化 SDK

\`\`\`javascript
import { register, sendEvent, EventName } from 'track-sdk';

// 注册 SDK
register({
  projectId: 'your-project-id', // 在平台创建的项目ID
  apiUrl: 'https://your-server.com/api/track', // 服务器地址
  uploadPercent: 1.0 // 数据上报比例，1.0表示100%
});
\`\`\`

### 发送事件

\`\`\`javascript
// 页面访问事件
sendEvent(EventName.PAGE_VIEW_EVENT, {
  pageUrl: window.location.href,
  pageTitle: document.title,
  referrer: document.referrer
});

// 点击事件
document.querySelector('#my-button').addEventListener('click', () => {
  sendEvent(EventName.CLICK_EVENT, {
    elementId: 'my-button',
    elementText: 'Click Me'
  });
});

// 自定义事件
sendEvent('custom_event', {
  action: 'add_to_cart',
  productId: '12345',
  price: 99.99
});
\`\`\`

### 添加通用参数

通用参数会自动附加到所有事件中:

\`\`\`javascript
import { addCommonParams } from 'track-sdk';

// 添加通用参数
addCommonParams({
  channel: 'web',
  version: '1.0.0',
  userType: 'registered',
  userId: '12345'
});
\`\`\`

## 自动收集的数据

SDK 会自动收集以下信息:

- 浏览器信息 (名称、版本)
- 操作系统信息
- 设备类型
- 屏幕分辨率
- 语言设置
- 时区
- 用户代理字符串
- 引用来源
- 页面标题
- 唯一用户标识符
  `;

  const appManagementContent = `
# 应用管理

## 创建新应用

1. 在侧边栏点击"应用管理"
2. 点击"新建应用"按钮
3. 填写应用信息:
   - 应用名称: 给您的应用起一个描述性的名称
   - 应用ID: 系统生成的唯一标识符，用于SDK集成
   - 描述: 可选的应用描述
4. 点击"创建"按钮完成

## 编辑应用

1. 在应用列表中找到需要编辑的应用
2. 点击"编辑"按钮
3. 修改应用信息
4. 点击"保存"按钮完成

## 配置埋点端点

1. 进入应用详情页面
2. 在"埋点端点"部分点击"添加端点"
3. 填写端点信息:
   - 名称: 端点名称
   - URL: 需要埋点的页面URL
   - 描述: 可选的描述信息
4. 点击"添加"按钮完成

## 删除应用

1. 在应用列表中找到需要删除的应用
2. 点击"删除"按钮
3. 在确认对话框中点击"确认"

**注意**: 删除应用将同时删除所有相关的事件数据，此操作不可逆。
  `;

  const eventAnalysisContent = `
# 事件分析

## 查看事件列表

1. 在侧边栏点击"事件分析"
2. 使用筛选器选择:
   - 应用: 选择要查看的应用
   - 时间范围: 选择数据时间范围
   - 事件类型: 可选择特定类型的事件

## 事件详情

点击事件列表中的任何事件可查看详细信息:

- 基本信息: 事件ID、项目ID、创建时间等
- 事件序列: 该会话中发生的所有事件
- 用户环境信息: 浏览器、操作系统、设备等信息

## 数据导出

1. 在事件列表页面点击"导出数据"按钮
2. 选择导出格式 (CSV 或 JSON)
3. 点击"导出"按钮

## 自定义分析

使用自定义分析功能深入了解数据:

1. 在侧边栏点击"自定义分析"
2. 选择分析维度和指标
3. 设置筛选条件
4. 点击"生成报告"
5. 查看可视化图表和数据表格
  `;

  const userManagementContent = `
# 用户管理

## 用户角色

平台支持两种用户角色:

- **管理员**: 拥有所有权限，可以管理用户、应用和查看所有数据
- **普通用户**: 只能查看被分配的应用数据

## 添加新用户

1. 在侧边栏点击"设置" > "用户管理"
2. 点击"添加用户"按钮
3. 填写用户信息:
   - 邮箱: 用户登录邮箱
   - 密码: 初始密码
   - 角色: 选择用户角色
4. 点击"创建"按钮完成

## 配置用户权限

为普通用户配置应用访问权限:

1. 在用户列表中找到需要配置的用户
2. 点击"配置权限"按钮
3. 选择该用户可以访问的应用
4. 点击"保存"按钮完成

## 启用/禁用用户

1. 在用户列表中找到需要操作的用户
2. 点击"启用"或"禁用"按钮
3. 在确认对话框中点击"确认"

## 重置用户密码

1. 在用户列表中找到需要重置密码的用户
2. 点击"重置密码"按钮
3. 输入新密码
4. 点击"确认"按钮完成
  `;

  const errorLogsContent = `
# 错误日志

## 查看错误日志

1. 在侧边栏点击"设置" > "错误日志"
2. 使用筛选器选择:
   - 应用: 选择要查看的应用
   - 时间范围: 选择数据时间范围

## 错误详情

点击错误列表中的任何错误可查看详细信息:

- 错误信息: 错误消息和堆栈跟踪
- 用户环境信息: 发生错误时的浏览器、操作系统等信息
- 页面信息: 错误发生的页面URL和标题

## 错误分析

错误分析功能帮助您了解错误趋势:

1. 查看错误趋势图表
2. 分析常见错误类型
3. 查看按浏览器、操作系统等维度的错误分布

## 错误通知

配置错误通知:

1. 在侧边栏点击"设置" > "通知设置"
2. 启用错误通知
3. 配置通知方式 (邮件、Slack等)
4. 设置通知阈值和频率
5. 点击"保存"按钮完成
  `;

  return (
    <div className="documentation-page">
      <Card title="使用说明" bordered>
        <Tabs
          defaultValue={activeTab}
          onChange={value => setActiveTab(value)}
          theme="card"
        >
          <TabPanel 
            value="overview" 
            label={<span><HelpCircleIcon />平台概述</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{overviewContent}</ReactMarkdown>
            </div>
          </TabPanel>
          
          <TabPanel 
            value="sdk" 
            label={<span><CodeIcon />SDK集成</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{sdkContent}</ReactMarkdown>
            </div>
          </TabPanel>
          
          <TabPanel 
            value="app-management" 
            label={<span><AppIcon />应用管理</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{appManagementContent}</ReactMarkdown>
            </div>
          </TabPanel>
          
          <TabPanel 
            value="event-analysis" 
            label={<span><ChartIcon />事件分析</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{eventAnalysisContent}</ReactMarkdown>
            </div>
          </TabPanel>
          
          <TabPanel 
            value="user-management" 
            label={<span><UserIcon />用户管理</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{userManagementContent}</ReactMarkdown>
            </div>
          </TabPanel>
          
          <TabPanel 
            value="error-logs" 
            label={<span><BugIcon />错误日志</span>}
          >
            <div className="markdown-content">
              <ReactMarkdown>{errorLogsContent}</ReactMarkdown>
            </div>
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
} 