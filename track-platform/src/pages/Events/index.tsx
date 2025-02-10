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
  const [browser, setBrowser] = useState<string>('');
  const [os, setOs] = useState<string>('');
  const navigate = useNavigate();

  // 获取所有可用的浏览器和操作系统选项
  const getBrowserOptions = () => {
    const browsers = [...new Set(data.map(item => item.userEnvInfo?.browserName).filter(Boolean))];
    return [
      { label: '全部', value: '' },
      ...browsers.map(browser => ({ label: browser, value: browser }))
    ];
  };

  const getOsOptions = () => {
    const systems = [...new Set(data.map(item => item.userEnvInfo?.osName).filter(Boolean))];
    return [
      { label: '全部', value: '' },
      ...systems.map(os => ({ label: os, value: os }))
    ];
  };

  const columns: PrimaryTableCol<EventItem>[] = [
    {
      title: '事件ID',
      colKey: '_id',
      width: 240,
      fixed: 'left',
      ellipsis: true,
      cell: (({ row }) => row._id),
    },
    {
      title: '触发时间',
      colKey: 'createdAt',
      width: 180,
      cell: ({ row }) => new Date(row.createdAt).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '事件类型',
      colKey: 'eventName',
      width: 160,
      cell: ({ row }) => {
        const eventTypeMap: Record<string, { label: string; theme: 'primary' | 'success' | 'warning' }> = {
          'click_event': { label: '点击事件', theme: 'primary' },
          'page_view_event': { label: '页面访问', theme: 'success' },
          'custom_event': { label: '自定义事件', theme: 'warning' }
        };
        const eventInfo = eventTypeMap[row.eventName] || { label: row.eventName, theme: 'primary' };
        return <Tag theme={eventInfo.theme} variant="light">{eventInfo.label}</Tag>;
      },
    },
    {
      title: '用户标识',
      colKey: 'userEnvInfo',
      width: 200,
      cell: ({ row }) => (
        <Space>
          <Tag theme="default" variant="light">UID</Tag>
          <span>{row.userEnvInfo?.uid || '-'}</span>
        </Space>
      ),
    },
    {
      title: '终端信息',
      colKey: 'userEnvInfo',
      width: 280,
      cell: ({ row }) => (
        <Space breakLine>
          <Tag theme="primary" variant="light">
            {row.userEnvInfo?.browserName || '-'}
          </Tag>
          <Tag theme="success" variant="light">
            {row.userEnvInfo?.osName || '-'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      colKey: 'operations',
      fixed: 'right',
      width: 160,
      cell: ({ row }) => (
        <Space size="small">
          <Button
            theme="primary"
            variant="text"
            icon={<BrowseIcon />}
            onClick={() => navigate(`/events/${row._id}`)}
          >
            详情
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

  const filteredData = data.filter(item => {
    return (
      (searchKey ? item._id.includes(searchKey) : true) &&
      (eventType ? item.eventName === eventType : true) &&
      (browser ? item.userEnvInfo?.browserName === browser : true) &&
      (os ? item.userEnvInfo?.osName === os : true)
    );
  });

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={[16, 16]}>
                <Col flex="300px">
                  <Input
                    value={searchKey}
                    onChange={setSearchKey}
                    placeholder="搜索 Event ID"
                    prefixIcon={<SearchIcon />}
                  />
                </Col>
                <Col flex="200px">
                  <Select
                    value={eventType}
                    onChange={(value) => setEventType(value as string)}
                    placeholder="事件类型"
                    options={[
                      { label: '全部', value: '' },
                      { label: '点击事件', value: 'click_event' },
                      { label: '页面访问', value: 'page_view_event' },
                      { label: '自定义事件', value: 'custom_event' },
                    ]}
                  />
                </Col>
                <Col flex="200px">
                  <Select
                    value={browser}
                    onChange={(value) => setBrowser(value as string)}
                    placeholder="浏览器"
                    options={getBrowserOptions()}
                  />
                </Col>
                <Col flex="200px">
                  <Select
                    value={os}
                    onChange={(value) => setOs(value as string)}
                    placeholder="操作系统"
                    options={getOsOptions()}
                  />
                </Col>
              </Row>
              <Table
                loading={loading}
                data={filteredData}
                columns={columns}
                rowKey="_id"
                hover
                stripe
                pagination={{
                  pageSize: 10,
                  total: filteredData.length,
                  showJumper: true,
                  totalContent: true
                }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}