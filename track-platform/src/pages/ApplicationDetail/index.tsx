import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, Form, Input, Button, Table, MessagePlugin, 
  Dialog, Space 
} from 'tdesign-react';
import request from '../../utils/request';
import { formatDateTime } from '../../utils/date';
const { FormItem } = Form;

interface Endpoint {
  _id: string;
  name: string;
  url: string;
  description?: string;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);
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
          <Button theme="danger" variant="text" onClick={() => handleDeleteClick(row)}>
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
      const response = await request.get(`/api/app/${id}`);
      console.log('Application response:', response);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response data');
      }

      setApplication(response);
      form.setFieldsValue({
        projectId: response.projectId,
        name: response.name,
        description: response.description,
      });
    } catch (error) {
      console.error('Failed to fetch application:', error);
      MessagePlugin.error('获取应用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      await request.put(`/api/app/${id}`, values);
      MessagePlugin.success('保存成功');
      setIsEditing(false);
      fetchApplication();
    } catch (error) {
      MessagePlugin.error('保存失败');
    }
  };

  const handleAddEndpoint = async () => {
    try {
      await endpointForm.validate();
      const values = endpointForm.getFieldsValue(true);
      
      // 确保必填字段存在
      if (!values.name || !values.url) {
        MessagePlugin.warning('请填写必填字段');
        return;
      }
      
      // 创建新端点
      const endpoint = {
        name: values.name,
        url: values.url,
        description: values.description || ''
      };
      
      // 发送请求添加端点
      const response = await request.post(`/api/app/${id}/endpoints`, endpoint);
      
      // 更灵活地处理响应
      const responseData = response as any;
      // 只要响应状态码是成功的，就认为添加成功
      if (responseData) {
        // 更新应用数据
        fetchApplication();
        MessagePlugin.success('端点添加成功');
        setShowEndpointDialog(false);
        endpointForm.reset();
      } else {
        MessagePlugin.error('端点添加失败');
      }
    } catch (error) {
      console.error('Failed to add endpoint:', error);
      MessagePlugin.error('端点添加失败');
    }
  };

  const handleDeleteClick = (endpoint: Endpoint) => {
    setDeleteTarget(endpoint);
    setDeleteCountdown(5);
    setShowDeleteDialog(true);
    
    const timer = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setDeleteTimer(timer);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteTarget(null);
    if (deleteTimer) {
      clearInterval(deleteTimer);
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!deleteTarget) return;
    
    try {
      // 确保使用正确的端点ID
      const endpointId = deleteTarget._id;
      if (!endpointId) {
        MessagePlugin.error('无效的端点ID');
        return;
      }
      
      await request.delete(`/api/app/${id}/endpoints/${endpointId}`);
      MessagePlugin.success('删除端点成功');
      fetchApplication();
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
      MessagePlugin.error('删除端点失败');
    } finally {
      handleDeleteCancel();
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
          data={application.endpoints || []}
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

      <Dialog
        header="删除确认"
        visible={showDeleteDialog}
        onClose={handleDeleteCancel}
        footer={
          <Space>
            <Button onClick={handleDeleteCancel}>取消</Button>
            <Button 
              theme="danger" 
              disabled={deleteCountdown > 0}
              onClick={handleDeleteEndpoint}
            >
              删除{deleteCountdown > 0 ? ` (${deleteCountdown}s)` : ''}
            </Button>
          </Space>
        }
      >
        <p>删除端点 "{deleteTarget?.name}"</p>
        <p>确定要永久删除端点 {deleteTarget?.url} 吗？</p>
      </Dialog>
    </div>
  );
} 