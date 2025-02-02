import React from 'react';
import { Table, Button, Space } from 'tdesign-react';
import 'tdesign-react/es/style/index.css';

interface EventData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

const EventManagement: React.FC = () => {
  const columns = [
    {
      colKey: 'name',
      title: 'Event Name',
    },
    {
      colKey: 'description',
      title: 'Description',
    },
    {
      colKey: 'createdAt',
      title: 'Created At',
    },
    {
      colKey: 'operation',
      title: 'Action',
      cell: () => (
        <Space>
          <Button theme="primary" variant="text">Edit</Button>
          <Button theme="danger" variant="text">Delete</Button>
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
      <Button theme="primary" style={{ marginBottom: 16 }}>
        Add New Event
      </Button>
      <Table columns={columns} data={data} rowKey="id" />
    </div>
  );
};

export default EventManagement; 