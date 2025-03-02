import React, { useState, useEffect } from 'react';
import { Table, Button, Dialog, Form, Input, Select, MessagePlugin, Space, Transfer, Tag } from 'tdesign-react';
import type { PrimaryTableCol, TransferValue } from 'tdesign-react';
import request from '../../utils/request';
import { User as AuthUser } from '../../types/auth';
import axios from 'axios';

const { FormItem } = Form;

interface MongoId {
  $oid: string;
}

interface Project {
  _id: MongoId;
  name: string;
  projectId: string;
}

interface User extends Omit<AuthUser, '_id'> {
  _id: MongoId;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

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
      cell: ({ row }) => {
        // 确定正确的用户ID
        const userId = typeof row._id === 'string' ? row._id : row._id?.$oid;
        
        return (
          <Space size={8}>
            <Button theme="primary" variant="text" onClick={() => handleGenerateApiKey(userId)}>
              生成API Key
            </Button>
            {row.role !== 'admin' && (
              <Button theme="warning" variant="text" onClick={() => handleConfigProjects(row)}>
                配置权限
              </Button>
            )}
            <Button
              theme={row.isActive ? 'danger' : 'success'}
              variant="outline"
              onClick={() => toggleUserStatus(userId, row.isActive)}
              disabled={row.email === 'admin@example.com'}
            >
              {row.isActive ? '禁用' : '启用'}
            </Button>
          </Space>
        );
      },
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
      // 保持原始 _id 结构
      const formattedProjects = response.map(p => ({
        ...p,
        _id: p._id  // 不转换 _id
      }));
      setProjects(formattedProjects);
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
    setSelectedProjects(user.accessibleProjects || []);
    setShowProjectDialog(true);
  };

  const handleSaveProjects = async (selectedIds: string[]) => {
    if (!currentUser) return;
    
    try {
      await request.post(`/api/users/${currentUser._id.$oid}/projects`, {
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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      
      // 确保有有效的用户ID
      if (!userId) {
        console.error('Invalid user ID');
        MessagePlugin.error('无效的用户ID');
        return;
      }
      
      console.log('Toggling status for user ID:', userId);
      
      // 使用 axios
      const token = localStorage.getItem('token');
      await axios.patch(`/api/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // 更新用户列表
      fetchUsers();
      MessagePlugin.success(`用户已${!currentStatus ? '启用' : '禁用'}`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      MessagePlugin.error('操作失败');
    } finally {
      setLoading(false);
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
        rowKey="id"
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
            // 打印完整的 currentUser 对象
            console.log('Current user:', currentUser);
            console.log('User ID type:', typeof currentUser._id);
            
            // 如果 _id 是字符串，直接使用
            const userId = typeof currentUser._id === 'string' 
              ? currentUser._id 
              : currentUser._id.$oid;

            console.log('Using userId:', userId);

            await request.post('/api/users/projects', {
              userId,
              projectIds: selectedProjects
            });
            MessagePlugin.success('配置成功');
            setShowProjectDialog(false);
            fetchUsers();
          } catch (error) {
            console.error('Failed to update projects:', error);
            MessagePlugin.error('配置失败');
          }
        }}
        style={{ width: '500px' }}
      >
        <Select
          multiple
          value={selectedProjects}
          onChange={(value) => {
            console.log('Selected projectIds:', value);
            setSelectedProjects(value as string[]);
          }}
          options={projects.map(p => ({
            label: `${p.name} (${p.projectId})`,
            value: p.projectId
          }))}
          placeholder="请选择可访问的应用"
          style={{ width: '100%' }}
        />
      </Dialog>
    </div>
  );
} 