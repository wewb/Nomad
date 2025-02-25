import React, { useState, useEffect } from 'react';
import { Table, Button, MessagePlugin, DatePicker } from 'tdesign-react';
import { PlusIcon } from 'tdesign-icons-react';
import axios from 'axios';
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
          <Button theme="danger" variant="text" onClick={() => handleDelete(row)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Application[]>('/api/app/list');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      MessagePlugin.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row: Application) => {
    navigate(`/applications/${row.id}`);
  };

  const handleDelete = async (row: Application) => {
    try {
      await axios.delete(`/api/app/${row.id}`);
      MessagePlugin.success('删除成功');
      fetchApplications();
    } catch (error) {
      console.error('Failed to delete application:', error);
      MessagePlugin.error('删除失败');
    }
  };

  return (
    <div className="applications">
      <div className="header-actions">
        <Button icon={<PlusIcon />} onClick={() => navigate('/applications/new')}>
          新建应用
        </Button>
      </div>
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
    </div>
  );
}