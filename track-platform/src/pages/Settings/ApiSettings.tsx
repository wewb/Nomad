import React, { useState, useEffect } from 'react';
import { Card, Button, MessagePlugin, Space } from 'tdesign-react';
import request from '../../utils/request';
import { getCurrentUser } from '../../services/auth';

interface ApiKey {
  _id: string;
  key: string;
  name: string;
}

export function ApiSettings() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    
    loadUser();
  }, []);

  const fetchApiKey = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/users/key');
      const responseData = response as any;
      if (responseData && responseData.data) {
        setApiKey(responseData.data);
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
      // 添加类型断言
      const err = error as any;
      // 如果没有密钥，不显示错误消息
      if (err.response && err.response.status !== 404) {
        MessagePlugin.error('获取API密钥失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const handleCreateKey = async () => {
    try {
      // 使用邮箱作为密钥名称
      const name = currentUser?.email || 'API Key';
      const response = await request.post('/api/users/key', { name });
      const responseData = response as any;
      if (responseData && responseData.data) {
        setApiKey(responseData.data);
        MessagePlugin.success('API密钥创建成功');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      MessagePlugin.error('创建API密钥失败');
    }
  };

  const handleDeleteKey = async () => {
    try {
      await request.delete('/api/users/key');
      setApiKey(null);
      MessagePlugin.success('API密钥删除成功');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      MessagePlugin.error('删除API密钥失败');
    }
  };

  return (
    <div className="api-settings">
      <Card title="API密钥管理" bordered>
        <Space direction="vertical" style={{ width: '100%' }}>
          {apiKey ? (
            <div>
              <h3>当前API密钥</h3>
              <p><strong>密钥:</strong> {apiKey.key}</p>
              <Button theme="danger" onClick={handleDeleteKey}>
                删除密钥
              </Button>
            </div>
          ) : (
            <div>
              <p>您还没有API密钥。创建一个新密钥以便在API请求中使用。</p>
              <Button theme="primary" onClick={handleCreateKey} loading={loading}>
                创建新密钥
              </Button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
} 