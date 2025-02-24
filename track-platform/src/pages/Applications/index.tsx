import React, { useState, useEffect } from 'react';
import { Table, Button, Dialog, Form, Input, MessagePlugin, Textarea } from 'tdesign-react';
import { AddIcon } from 'tdesign-icons-react';
import axios from 'axios';

interface Application {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  endpoints: Array<{
    url: string;
    name: string;
    description: string;
  }>;
  createdAt: string;
}

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await axios.get<Application[]>('/api/app');
      setApplications(response.data);
    } catch (error) {
      MessagePlugin.error('Failed to fetch applications');
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const columns = [
    {
      title: '应用ID',
      colKey: 'projectId',
    },
    {
      title: '名称',
      colKey: 'name',
    },
    {
      title: '描述',
      colKey: 'description',
    },
    {
      title: '端点数量',
      cell: ({ row }: { row: Application }) => row.endpoints.length,
    },
    {
      title: '创建时间',
      colKey: 'createdAt',
      cell: ({ row }: { row: Application }) => new Date(row.createdAt).toLocaleString(),
    },
    {
      title: '操作',
      cell: ({ row }: { row: Application }) => (
        <>
          <Button theme="default" onClick={() => window.location.href = `/applications/${row.projectId}`}>
            查看详情
          </Button>
          <Button theme="danger" onClick={() => handleDelete(row.projectId)}>
            删除
          </Button>
        </>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      await axios.post('/api/app', values);
      MessagePlugin.success('Application created successfully');
      setVisible(false);
      form.reset();
      fetchApplications();
    } catch (error) {
      MessagePlugin.error('Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await axios.delete(`/api/app/${projectId}`);
      MessagePlugin.success('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      MessagePlugin.error('Failed to delete application');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button theme="primary" icon={<AddIcon />} onClick={() => setVisible(true)}>
          创建应用
        </Button>
      </div>

      <Table columns={columns} data={applications} rowKey="_id" />

      <Dialog
        header="创建新应用"
        visible={visible}
        onConfirm={handleCreate}
        onClose={() => setVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form}>
          <Form.FormItem label="应用ID" name="projectId" rules={[{ required: true }]}>
            <Input placeholder="请输入应用ID" />
          </Form.FormItem>
          <Form.FormItem label="名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入应用名称" />
          </Form.FormItem>
          <Form.FormItem label="描述" name="description">
            <Textarea placeholder="请输入应用描述" />
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}

export default Applications; 