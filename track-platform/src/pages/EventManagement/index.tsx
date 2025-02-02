import React from 'react';
import { Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface EventData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

const EventManagement: React.FC = () => {
  const columns: ColumnsType<EventData> = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Edit</Button>
          <Button type="link" danger>Delete</Button>
        </Space>
      ),
    },
  ];

  const data: EventData[] = [
    {
      id: '1',
      name: 'page_view',
      description: 'Track page views',
      createdAt: '2024-02-01',
    },
  ];

  return (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }}>
        Add New Event
      </Button>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default EventManagement; 