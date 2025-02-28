import React, { useState, useEffect } from 'react';
import { Table, Button, Dialog, Form, Input, Select, MessagePlugin, Space, Transfer, Tag } from 'tdesign-react';
import type { PrimaryTableCol, TransferValue } from 'tdesign-react';
import request from '../../utils/request';
import { User } from '../../types/auth';

const { FormItem } = Form;

interface Project {
  _id: string;
  name: string;
  projectId: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const columns: PrimaryTableCol<User>[] = [
    { title: '邮箱', colKey: 'email', width: '25%' },
    { title: '角色', colKey: 'role', width: '15%', cell: ({ row }) => (
      <Tag theme={row.role === 'admin' ? 'primary' : 'warning'} variant="light">
        {row.role === 'admin' ? '管理员' : '普通用户'}
      </Tag>
    )},
    { 
      title: '状态', 
      colKey: 'isActive', 
      width: '10%',
      cell: ({ row }) => (
        <Tag theme={row.isActive ? 'success' : 'danger'} variant="light">
          {row.isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    { title: 'API Key', colKey: 'apiKey', width: '25%', ellipsis: true },
    {
      title: '操作',
      colKey: 'operation',
      width: '25%',
      cell: ({ row }) => (
        <Space size={8}>
          <Button theme="primary" variant="text" onClick={() => handleGenerateApiKey(row._id)}>
            生成API Key
          </Button>
          {row.role !== 'admin' && (
            <Button theme="warning" variant="text" onClick={() => handleConfigProjects(row)}>
              配置权限
            </Button>
          )}
          <Button theme={row.isActive ? 'danger' : 'success'} variant="text">
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

  const fetchProjects = async () => {
    try {
      const response = await request.get<any, Project[]>('/api/app/list');
      console.log('Fetched projects:', response); // 检查获取的项目数据
      setProjects(response);
    } catch (error) {
      MessagePlugin.error('获取项目列表失败');
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

  const handleConfigProjects = (user: User) => {
    setCurrentUser(user);
    setShowProjectDialog(true);
  };

  const handleSaveProjects = async (selectedIds: string[]) => {
    if (!currentUser) return;
    
    try {
      await request.put(`/api/users/${currentUser._id}/projects`, {
        projectIds: selectedIds
      });
      MessagePlugin.success('配置成功');
      setShowProjectDialog(false);
      fetchUsers();
    } catch (error) {
      MessagePlugin.error('配置失败');
    }
  };

  const handleCreateUser = async (formData: any) => {
    try {
      await request.post('/api/users', formData);
      MessagePlugin.success('创建成功');
      setShowDialog(false);
      form.reset();
      fetchUsers(); // 刷新用户列表
    } catch (error: any) {
      MessagePlugin.error(error.response?.data?.error || '创建失败');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
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

      <Dialog
        header="配置可读应用"
        visible={showProjectDialog}
        onClose={() => setShowProjectDialog(false)}
        onConfirm={async () => {
          if (!currentUser) return;
          
          try {
            const values = form.getFieldsValue(['projects']);
            console.log('Form values:', values);
            
            if (!Array.isArray(values.projects) || values.projects.length === 0) {
              return MessagePlugin.warning('请选择至少一个应用');
            }

            await request.post(`/api/users/${currentUser._id}/projects`, {
              projectIds: values.projects
            });
            MessagePlugin.success('配置成功');
            setShowProjectDialog(false);
            fetchUsers();
          } catch (error) {
            console.error('Config projects error:', error);
            MessagePlugin.error('配置失败');
          }
        }}
        style={{ width: '500px' }}
      >
        <Form form={form}>
          <FormItem name="projects" label="可读应用">
            <Select
              multiple
              defaultValue={currentUser?.accessibleProjects}  // 使用 defaultValue
              options={projects.map(p => ({
                label: `${p.name} (${p.projectId})`,
                value: p._id  // 确保这里是 ObjectId
              }))}
              onChange={(value) => {
                console.log('Select onChange value:', value); // 检查选择变化
                form.setFieldsValue({ projects: value });
              }}
              placeholder="请选择可访问的应用"
              style={{ width: '100%' }}
            />
          </FormItem>
        </Form>
      </Dialog>
    </div>
  );
} 