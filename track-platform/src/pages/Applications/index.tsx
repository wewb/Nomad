import React, { useState, useEffect } from 'react';
import { Table, Button, MessagePlugin, DatePicker, Dialog, Space, Row } from 'tdesign-react';
import { PlusIcon } from 'tdesign-icons-react';
import request from '../../utils/request';
import { formatDateTime } from '../../utils/date';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  projectId: string;
  name: string;
  description: string;
  endpointCount: number;
  createdAt: string;
}

export function Applications() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Application[]>([]);
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);

  const columns = [
    {
      title: 'ID',
      colKey: 'id',
      width: 240,
      ellipsis: true,
    },
    {
      title: '应用ID',
      colKey: 'projectId',
      width: 120,
    },
    {
      title: '名称',
      colKey: 'name',
      width: 200,
    },
    {
      title: '描述',
      colKey: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '应用端点',
      colKey: 'endpointCount',
      width: 100,
      cell: ({ row }: { row: Application }) => `${Number(row.endpointCount)} 个`,
    },
    {
      title: '创建时间',
      colKey: 'createdAt',
      width: 180,
      cell: ({ row }: { row: Application }) => formatDateTime(row.createdAt),
    },
    {
      title: '操作',
      colKey: 'operation',
      width: 160,
      cell: ({ row }: { row: Application }) => (
        <div className="table-operations">
          <Button theme="primary" variant="text" onClick={() => handleView(row)}>
            查看
          </Button>
          <Button theme="danger" variant="text" onClick={() => handleDeleteClick(row)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await request.get('/api/app/list');
      setData(response);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      MessagePlugin.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleView = (row: Application) => {
    navigate(`/applications/${row.id}`);
  };

  const handleDeleteClick = (row: Application) => {
    setDeleteTarget(row);
    setDeleteCountdown(5);
    setShowDeleteDialog(true);
    
    // 开始倒计时
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await request.delete(`/api/app/${deleteTarget.id}`);
      MessagePlugin.success('删除成功');
      fetchApplications();
    } catch (error) {
      console.error('Failed to delete application:', error);
      MessagePlugin.error('删除失败');
    } finally {
      handleDeleteCancel();
    }
  };

  return (
    <div className="applications">
      <div className="header-actions">
        <Button icon={<PlusIcon />} onClick={() => navigate('/applications/new')}>
          新建应用
        </Button>
      </div>
      <br></br>
      <Table
        loading={loading}
        data={data}
        columns={columns}
        rowKey="id"
        hover
        stripe
        pagination={{
          defaultCurrent: 1,
          defaultPageSize: 10,
          showJumper: true,
          pageSizeOptions: [10, 20, 50],
        }}
      />
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
              onClick={handleDelete}
            >
              删除{deleteCountdown > 0 ? ` (${deleteCountdown}s)` : ''}
            </Button>
          </Space>
        }
      >
        <p>删除应用 "{deleteTarget?.projectId}"</p>
        <p>确定要永久删除应用 {deleteTarget?.projectId} 以及其中的 {deleteTarget?.endpointCount} 个端点吗？</p>
      </Dialog>
    </div>
  );
}