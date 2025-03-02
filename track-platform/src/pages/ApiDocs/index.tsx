import React from 'react';
import { Card, Divider, Table, Space, Typography, Alert } from 'tdesign-react';

const { Title, Paragraph, Text } = Typography;

export function ApiDocs() {
  const baseUrl = window.location.origin;
  
  const endpointColumns = [
    { title: '端点', colKey: 'endpoint', width: 300 },
    { title: '描述', colKey: 'description', width: 300 },
    { title: '权限', colKey: 'permission', width: 150 },
    { title: '参数', colKey: 'params', width: 250 },
  ];
  
  const endpoints = [
    {
      endpoint: '/api-key/test',
      description: '测试 API 是否正常工作',
      permission: '无需认证',
      params: '无',
    },
    {
      endpoint: '/api-key/users/list',
      description: '获取所有用户列表',
      permission: '仅管理员',
      params: 'key=YOUR_API_KEY',
    },
    {
      endpoint: '/api-key/app/list',
      description: '获取应用列表（根据用户权限）',
      permission: '所有用户',
      params: 'key=YOUR_API_KEY',
    },
    {
      endpoint: '/api-key/app/:id',
      description: '获取单个应用详情',
      permission: '有权限的用户',
      params: 'key=YOUR_API_KEY',
    },
    {
      endpoint: '/api-key/app/:id/events',
      description: '获取应用事件列表',
      permission: '有权限的用户',
      params: 'key=YOUR_API_KEY, page=1, limit=20',
    },
  ];

  return (
    <div className="api-docs">
      <Card title="API 文档" bordered>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            theme="info"
            message="API 密钥是访问 API 的凭证，请妥善保管，不要泄露给他人。"
            style={{ marginBottom: '20px' }}
          />
          
          <Title level="h2">概述</Title>
          <Paragraph>
            Track Platform 提供了一组只读 API，允许您以编程方式访问平台数据。所有 API 请求都需要使用 API 密钥进行认证。
          </Paragraph>
          
          <Title level="h2">认证</Title>
          <Paragraph>
            所有 API 请求都需要在查询参数中包含 API 密钥：
            <Text code>{`?key=YOUR_API_KEY`}</Text>
          </Paragraph>
          <Paragraph>
            您可以在 <Text strong>设置 &gt; API 设置</Text> 中创建和管理您的 API 密钥。
          </Paragraph>
          
          <Title level="h2">基本 URL</Title>
          <Paragraph>
            <Text code>{baseUrl}/api-key</Text>
          </Paragraph>
          
          <Title level="h2">请求格式</Title>
          <Paragraph>
            所有 API 请求都使用 HTTP GET 方法，并返回 JSON 格式的响应。
          </Paragraph>
          
          <Title level="h2">权限</Title>
          <Paragraph>
            API 访问权限基于您的用户角色：
          </Paragraph>
          <ul>
            <li>管理员可以访问所有 API 端点</li>
            <li>普通用户只能访问被分配给他们的应用和相关事件</li>
          </ul>
          
          <Divider />
          
          <Title level="h2">API 端点</Title>
          <Table
            data={endpoints}
            columns={endpointColumns}
            rowKey="endpoint"
            bordered
            stripe
            style={{ marginBottom: '20px' }}
          />
          
          <Title level="h3">示例请求</Title>
          <Paragraph>
            获取应用列表：
            <Text code>{`${baseUrl}/api-key/app/list?key=YOUR_API_KEY`}</Text>
          </Paragraph>
          
          <Title level="h3">示例响应</Title>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
{`[
  {
    "id": "60d21b4667d0d8992e610c85",
    "projectId": "project-1",
    "name": "示例应用",
    "description": "这是一个示例应用",
    "endpointCount": 2,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]`}
          </pre>
          
          <Title level="h2">错误处理</Title>
          <Paragraph>
            API 错误会返回适当的 HTTP 状态码和 JSON 格式的错误消息：
          </Paragraph>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
{`{
  "error": "错误消息"
}`}
          </pre>
          
          <Title level="h3">常见错误状态码</Title>
          <ul>
            <li><Text strong>400</Text> - 请求参数错误</li>
            <li><Text strong>401</Text> - 未认证或 API 密钥无效</li>
            <li><Text strong>403</Text> - 没有权限访问请求的资源</li>
            <li><Text strong>404</Text> - 请求的资源不存在</li>
            <li><Text strong>500</Text> - 服务器内部错误</li>
          </ul>
          
          <Title level="h2">限制</Title>
          <Paragraph>
            <ul>
              <li>API 仅支持只读操作（GET 请求）</li>
              <li>API 请求可能受到速率限制</li>
              <li>返回的数据可能会被分页</li>
            </ul>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
} 