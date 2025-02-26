import React, { useState, useEffect } from 'react';
import { Table, Button, Dialog, Form, Input, Select, MessagePlugin, Space } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import request from '../../utils/request';
import { User } from '../../types/auth';

const { FormItem } = Form;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form] = Form.useForm();

  const columns: PrimaryTableCol<User>[] = [
    { title: '邮箱', colKey: 'email' },
    { title: '角色', colKey: 'role', cell: ({ row }) => row.role === 'admin' ? '管理员' : '普通用户' },
    { title: 'API Key', colKey: 'apiKey', ellipsis: true },
    { title: '状态', colKey: 'isActive', cell: ({ row }) => row.isActive ? '启用' : '禁用' },
    {
      title: '操作',
      colKey: 'operation',
      cell: ({ row }) => (
        <Space>
          <Button theme="primary" variant="text" onClick={() => handleGenerateApiKey(row._id)}>
            生成API Key
          </Button>
          <Button theme="danger" variant="text">
            {row.isActive ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request.get<any, User[]>('/api/users');
      setUsers(response);
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async (userId: string) => {
    try {
      const response = await request.post(`/api/users/${userId}/api-key`);
      MessagePlugin.success('API Key 生成成功');
      fetchUsers();
    } catch (error) {
      MessagePlugin.error('API Key 生成失败');
    }
  };

  const handleCreateUser = async (values: any) => {
    try {
      await request.post('/api/users', values);
      MessagePlugin.success('创建用户成功');
      setShowDialog(false);
      form.reset();
      fetchUsers();
    } catch (error) {
      MessagePlugin.error('创建用户失败');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="user-management">
      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => setShowDialog(true)}>新增用户</Button>
      </div>

      <Table
        loading={loading}
        data={users}
        columns={columns}
        rowKey="_id"
        hover
      />

      <Dialog
        header="新增用户"
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={() => form.submit()}
      >
        <Form form={form} onSubmit={handleCreateUser}>
          <FormItem name="email" label="邮箱" rules={[{ required: true }]}>
            <Input />
          </FormItem>
          <FormItem name="password" label="密码" rules={[{ required: true }]}>
            <Input type="password" />
          </FormItem>
          <FormItem name="role" label="角色" rules={[{ required: true }]}>
            <Select options={[
              { label: '管理员', value: 'admin' },
              { label: '普通用户', value: 'user' }
            ]} />
          </FormItem>
        </Form>
      </Dialog>
    </div>
  );
} 