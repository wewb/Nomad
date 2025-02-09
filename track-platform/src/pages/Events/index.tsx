import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, MessagePlugin, Input, Select, Row, Col, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { ChartIcon, SearchIcon, BrowseIcon, DeleteIcon } from 'tdesign-icons-react';

interface EventItem {
  _id: string;
  eventName: string;
  createdAt: string;
  projectId: string;
  eventParams: Record<string, any>;
  userEnvInfo: {
    browserName: string;
    osName: string;
    uid: string;
  };
}

export function Events() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventItem[]>([]);
  const [searchKey, setSearchKey] = useState('');
  const [eventType, setEventType] = useState<string>('');
  const navigate = useNavigate();

  const columns: PrimaryTableCol<EventItem>[] = [
    {
      title: 'Event ID',
      colKey: '_id',
      width: 240,
      fixed: 'left',
    },
    {
      title: '时间',
      colKey: 'createdAt',
      width: 180,
      render: ({ row }) => new Date(row.createdAt).toLocaleString(),
    },
    {
      title: '事件类型',
      colKey: 'eventName',
      width: 160,
      render: ({ row }) => (
        <Tag theme="primary" variant="light">
          {row.eventName}
        </Tag>
      ),
    },
    {
      title: '用户ID',
      colKey: 'userEnvInfo.uid',
      width: 120,
      render: ({ row }) => row.userEnvInfo?.uid || '-',
    },
    {
      title: '环境信息',
      colKey: 'userEnvInfo',
      width: 200,
      render: ({ row }) => (
        <Space direction="vertical">
          <span>浏览器: {row.userEnvInfo?.browserName || '-'}</span>
          <span>系统: {row.userEnvInfo?.osName || '-'}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      colKey: 'operations',
      fixed: 'right',
      width: 180,
      render: ({ row }) => (
        <Space>
          <Button
            theme="primary"
            variant="text"
            icon={<BrowseIcon />}
            onClick={() => navigate(`/events/${row._id}`)}
          >
            详情
          </Button>
          <Button
            theme="primary"
            variant="text"
            icon={<ChartIcon />}
            onClick={() => navigate(`/event-analysis/${row.eventName}`)}
          >
            分析
          </Button>
          <Button
            theme="danger"
            variant="text"
            icon={<DeleteIcon />}
            onClick={() => handleDelete(row._id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条事件记录吗？')) return;
    try {
      const response = await fetch(`/api/track/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除失败');
      MessagePlugin.success('删除成功');
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      MessagePlugin.error('删除失败');
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/track/list');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      MessagePlugin.error('获取事件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="center">
                <Input
                  value={searchKey}
                  onChange={setSearchKey}
                  placeholder="搜索 Event ID"
                  prefixIcon={<SearchIcon />}
                  style={{ width: 300 }}
                />
                <Select
                  value={eventType}
                  onChange={(value) => setEventType(value as string)}
                  placeholder="事件类型"
                  style={{ width: 200 }}
                  options={[
                    { label: '全部', value: '' },
                    { label: '点击事件', value: 'click_event' },
                    { label: '页面访问', value: 'page_view_event' },
                    { label: '自定义事件', value: 'custom_event' },
                  ]}
                />
              </Space>
              <Table
                loading={loading}
                data={data.filter(item => 
                  (searchKey ? item._id.includes(searchKey) : true) &&
                  (eventType ? item.eventName === eventType : true)
                )}
                columns={columns}
                rowKey="_id"
                hover
                stripe
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}