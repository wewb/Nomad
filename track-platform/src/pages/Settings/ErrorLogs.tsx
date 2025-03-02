import React, { useState, useEffect } from 'react';
import { Table, DateRangePicker, Select, Button, Space, MessagePlugin, Drawer, Textarea } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import request from '../../utils/request';
import { getCurrentUser } from '../../services/auth';
import { formatDate } from '../../utils/date';

interface ErrorLog {
  _id: string;
  projectId: string;
  data: {
    type: string;
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    timestamp: string;
    url: string;
  };
  createdAt: string;
}

interface Project {
  id: string;
  projectId: string;
  name: string;
}

export function ErrorLogs() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
    new Date()
  ]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentError, setCurrentError] = useState<ErrorLog | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await request.get('/api/app/list');
      console.log('Projects response:', res); // 添加日志查看响应格式
      
      // 检查响应格式并适配
      if (Array.isArray(res)) {
        // 如果直接返回数组
        setProjects(res);
      } else if (res && Array.isArray(res.data)) {
        // 如果返回 { data: [...] } 格式
        setProjects(res.data);
      } else if (res && typeof res === 'object') {
        // 尝试将对象转换为数组
        const projectsArray = Object.values(res).filter(item => 
          item && typeof item === 'object' && 'projectId' in item
        );
        console.log('Converted projects array:', projectsArray);
        setProjects(projectsArray as Project[]);
      } else {
        console.error('Unexpected projects data format:', res);
        setProjects([]);
      }
    } catch (error) {
      MessagePlugin.error('获取项目列表失败');
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    }
  };

  const fetchErrors = async () => {
    setLoading(true);
    try {
      // 直接获取错误事件列表
      const response = await request.get('/api/track/list', {
        params: {
          type: 'error_event',
          limit: 100
        }
      });
      
      console.log('Error data:', response); // 添加日志以检查数据结构
      
      if (Array.isArray(response.data)) {
        setErrors(response.data);
      } else {
        setErrors([]);
        console.warn('Unexpected response format:', response);
      }
    } catch (error) {
      MessagePlugin.error('获取错误日志失败');
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchErrors();
  };

  const getProjectName = (projectId: string) => {
    if (!projectId) return '未知项目';
    
    // 尝试多种方式查找项目
    const project = projects.find(p => 
      p.projectId === projectId || 
      p.id === projectId || 
      (p as any)._id === projectId
    );
    
    return project ? project.name : projectId;
  };

  const showErrorDetail = (error: ErrorLog) => {
    setCurrentError(error);
    setDetailVisible(true);
  };

  const columns: PrimaryTableCol<ErrorLog>[] = [
    {
      title: '项目',
      colKey: 'projectId',
      width: 150,
      render: ({ row }) => getProjectName(row.projectId)
    },
    {
      title: '错误类型',
      colKey: 'data.type',
      width: 120,
      render: ({ row }) => row.data?.type || '未知类型'
    },
    {
      title: '错误信息',
      colKey: 'data.message',
      width: 300,
      ellipsis: true,
      render: ({ row }) => row.data?.message || '无错误信息'
    },
    {
      title: '页面URL',
      colKey: 'data.url',
      width: 250,
      ellipsis: true,
      render: ({ row }) => row.data?.url || '未知URL'
    },
    {
      title: '发生时间',
      colKey: 'createdAt',
      width: 180,
      render: ({ row }) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '未知时间'
    },
    {
      title: '操作',
      colKey: 'operation',
      width: 100,
      fixed: 'right',
      cell: ({ row }) => (
        <Button theme="primary" variant="text" onClick={() => showErrorDetail(row)}>
          详情
        </Button>
      )
    }
  ];

  useEffect(() => {
    fetchProjects();
    fetchErrors();
  }, []);

  return (
    <div className="error-logs">
      <div className="filter-bar" style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Select
          value={selectedProject}
          onChange={(value) => setSelectedProject(String(value))}
          placeholder="项目应用"
          clearable
          style={{ width: 200 }}
          options={projects.map(p => ({ 
            label: p.name || '未命名项目', 
            value: p.projectId || p.id || (p as any)._id 
          }))}
        />
        <DateRangePicker
          value={dateRange}
          onChange={(value) => setDateRange(value as [Date, Date])}
          style={{ width: 300 }}
        />
        <Button theme="primary" onClick={handleSearch}>查询</Button>
      </div>

      <Table
        loading={loading}
        data={errors}
        columns={columns}
        rowKey="_id"
        hover
        stripe
        pagination={{
          pageSize: 20,
          total: errors.length,
          showJumper: true,
          showPageSize: true,
        }}
      />

      <Drawer
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        size="large"
        header="错误详情"
        footer={
          <Button theme="primary" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        }
      >
        {currentError && (
          <div style={{ padding: '16px' }}>
            <h3>基本信息</h3>
            <p><strong>项目：</strong> {getProjectName(currentError.projectId)}</p>
            <p><strong>错误类型：</strong> {currentError.data?.type || '未知类型'}</p>
            <p><strong>发生时间：</strong> {currentError.createdAt ? new Date(currentError.createdAt).toLocaleString() : '未知时间'}</p>
            <p><strong>页面URL：</strong> {currentError.data?.url || '未知URL'}</p>
            
            <h3>错误信息</h3>
            <p>{currentError.data?.message || '无错误信息'}</p>
            
            {currentError.data?.filename && (
              <p><strong>文件：</strong> {currentError.data.filename} (行: {currentError.data.lineno}, 列: {currentError.data.colno})</p>
            )}
            
            <h3>堆栈信息</h3>
            <Textarea
              value={currentError.data?.stack || '无堆栈信息'}
              autosize={{ minRows: 10, maxRows: 20 }}
              readonly
            />
          </div>
        )}
      </Drawer>
    </div>
  );
} 