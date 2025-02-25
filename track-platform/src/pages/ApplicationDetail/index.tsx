import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, Form, Input, Button, Table, MessagePlugin, 
  Dialog, Space 
} from 'tdesign-react';
import axios from 'axios';
import { formatDateTime } from '../../utils/date';
const { FormItem } = Form;

interface Endpoint {
  id: string;
  url: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Application {
  id: string;
  projectId: string;
  name: string;
  description: string;
  endpoints: Endpoint[];
  createdAt: string;
  updatedAt: string;
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  const [form] = Form.useForm();
  const [endpointForm] = Form.useForm();

  const endpointColumns = [
    { title: '名称', colKey: 'name', width: 200 },
    { title: 'URL', colKey: 'url', width: 300 },
    { title: '描述', colKey: 'description', width: 300 },
    { title: '创建时间', colKey: 'createdAt', width: 180,
      cell: ({ row }: { row: Endpoint }) => formatDateTime(row.createdAt)
    },
    {
      title: '操作',
      colKey: 'operation',
      width: 160,
      cell: ({ row }: { row: Endpoint }) => (
        <Space>
          <Button theme="danger" variant="text" onClick={() => handleDeleteEndpoint(row)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await axios.get<Application>(`/api/app/detail/${id}`);
      setApplication(response.data);
      form.setFieldsValue({
        projectId: response.data.projectId,
        name: response.data.name,
        description: response.data.description,
      });
    } catch (error) {
      MessagePlugin.error('获取应用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      await axios.put(`/api/app/${id}`, values);
      MessagePlugin.success('保存成功');
      setIsEditing(false);
      fetchApplication();
    } catch (error) {
      MessagePlugin.error('保存失败');
    }
  };

  const handleAddEndpoint = async (values: any) => {
    try {
      await axios.post(`/api/app/${id}/endpoints`, values);
      MessagePlugin.success('添加端点成功');
      setShowEndpointDialog(false);
      endpointForm.reset();
      fetchApplication();
    } catch (error) {
      MessagePlugin.error('添加端点失败');
    }
  };

  const handleDeleteEndpoint = async (endpoint: Endpoint) => {
    try {
      await axios.delete(`/api/app/${id}/endpoints/${endpoint.id}`);
      MessagePlugin.success('删除端点成功');
      fetchApplication();
    } catch (error) {
      MessagePlugin.error('删除端点失败');
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!application) return <div>应用不存在</div>;

  return (
    <div className="application-detail">
      <Card title="基本信息">
        <Form
          form={form}
          onSubmit={handleSave}
          disabled={!isEditing}
        >
          <FormItem label="应用ID" name="projectId">
            <Input />
          </FormItem>
          <FormItem label="名称" name="name">
            <Input />
          </FormItem>
          <FormItem label="描述" name="description">
            <Input />
          </FormItem>
          <FormItem>
            {isEditing ? (
              <Space>
                <Button theme="primary" type="submit">保存</Button>
                <Button onClick={() => setIsEditing(false)}>取消</Button>
              </Space>
            ) : (
              <Button onClick={() => setIsEditing(true)}>编辑</Button>
            )}
          </FormItem>
        </Form>
      </Card>

      <Card 
        title="端点管理" 
        actions={
          <Button onClick={() => setShowEndpointDialog(true)}>添加端点</Button>
        }
      >
        <Table
          data={application.endpoints}
          columns={endpointColumns}
          rowKey="id"
        />
      </Card>

      <Dialog
        header="添加端点"
        visible={showEndpointDialog}
        onClose={() => setShowEndpointDialog(false)}
        onConfirm={() => endpointForm.submit()}
      >
        <Form
          form={endpointForm}
          onSubmit={handleAddEndpoint}
        >
          <FormItem label="名称" name="name">
            <Input />
          </FormItem>
          <FormItem label="URL" name="url">
            <Input />
          </FormItem>
          <FormItem label="描述" name="description">
            <Input />
          </FormItem>
        </Form>
      </Dialog>
    </div>
  );
} 