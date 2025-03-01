import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, MessagePlugin, Table, Space } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import request from '../../utils/request';
import type { SubmitContext } from 'tdesign-react';

const { FormItem } = Form;

interface Endpoint {
  name: string;
  url: string;
  description?: string;
}

interface CreateAppRequest {
  projectId: string;
  name: string;
  description?: string;
  endpoints: Endpoint[];
}

interface CreateAppResponse {
  _id: {
    $oid: string;
  };
  projectId: string;
  name: string;
  description?: string;
  endpoints: Array<Endpoint & {
    _id: { $oid: string };
    createdAt: { $date: string };
  }>;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v: number;
}

interface ApiResponse<T> {
  data: T;
}

interface FormData {
  projectId: string;
  name: string;
  description?: string;
}

export function ApplicationNew() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [endpointForm] = Form.useForm();

  const columns: PrimaryTableCol<Endpoint>[] = [
    { title: '名称', colKey: 'name' },
    { title: 'URL', colKey: 'url' },
    { title: '描述', colKey: 'description' },
    {
      title: '操作',
      colKey: 'op',
      cell: ({ rowIndex }) => (
        <Button theme="danger" variant="text" onClick={() => {
          const newEndpoints = [...endpoints];
          newEndpoints.splice(rowIndex, 1);
          setEndpoints(newEndpoints);
        }}>
          删除
        </Button>
      ),
    },
  ];

  const handleAddEndpoint = async () => {
    try {
      await endpointForm.validate();
      const values = endpointForm.getFieldsValue(true);
      
      // 确保必填字段存在
      if (!values.name || !values.url) {
        MessagePlugin.warning('请填写必填字段');
        return;
      }
      
      // 创建新端点并添加到列表
      const newEndpoint: Endpoint = {
        name: values.name,
        url: values.url,
        description: values.description
      };
      
      setEndpoints([...endpoints, newEndpoint]);
      endpointForm.reset();
      setShowEndpointForm(false);
      
      // 显示成功消息
      MessagePlugin.success('端点添加成功');
    } catch (error) {
      console.error('Endpoint form validation failed:', error);
      MessagePlugin.error('端点添加失败');
    }
  };

  const handleSubmit = async (e: any) => {
    try {
      if (e.validateResult === true) {
        const formData = form.getFieldsValue(true);
        const requestData = {
          projectId: formData.projectId,
          name: formData.name,
          description: formData.description,
          endpoints
        };

        await request.post('/api/app', requestData);
        MessagePlugin.success('创建成功');
        
        // 直接导航到应用列表页面
        navigate('/applications');
      }
    } catch (error) {
      console.error('Failed to create application:', error);
      MessagePlugin.error('创建失败');
      // 发生错误时也返回应用列表
      navigate('/applications');
    }
  };

  return (
    <div className="application-new">
      <Card title="创建新应用">
        <Form form={form} onSubmit={handleSubmit}>
          <FormItem label="应用ID" name="projectId" rules={[{ required: true }]}>
            <Input placeholder="请输入应用ID" />
          </FormItem>
          <FormItem label="名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入应用名称" />
          </FormItem>
          <FormItem label="描述" name="description">
            <Input placeholder="请输入应用描述" />
          </FormItem>

          <Card title="端点配置" bordered>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Table
                data={endpoints}
                columns={columns}
                rowKey="url"
                bordered
                style={{ marginBottom: '16px' }}
              />

              {showEndpointForm ? (
                <Form form={endpointForm}>
                  <FormItem label="名称" name="name" rules={[{ required: true }]}>
                    <Input placeholder="请输入端点名称" />
                  </FormItem>
                  <FormItem label="URL" name="url" rules={[{ required: true }]}>
                    <Input placeholder="请输入端点URL" />
                  </FormItem>
                  <FormItem label="描述" name="description">
                    <Input placeholder="请输入端点描述" />
                  </FormItem>
                  <Space>
                    <Button theme="primary" onClick={handleAddEndpoint}>
                      添加
                    </Button>
                    <Button onClick={() => setShowEndpointForm(false)}>
                      取消
                    </Button>
                  </Space>
                </Form>
              ) : (
                <Button onClick={() => setShowEndpointForm(true)}>
                  添加端点
                </Button>
              )}
            </Space>
          </Card>

          <FormItem style={{ marginTop: '24px' }}>
            <Button theme="primary" type="submit">
              创建应用
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
} 