import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, MessagePlugin, Input, Select, Row, Col, Tag, DateRangePicker } from 'tdesign-react';
import type { PrimaryTableCol, PrimaryTableRenderParams, PrimaryTableCellParams } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { ChartIcon, SearchIcon, BrowseIcon, DeleteIcon } from 'tdesign-icons-react';
import request from '../../utils/request';

interface EventItem {
  _id: string;
  eventName: string;
  projectId: string;
  projectName?: string;
  createdAt: string;
  eventParams: Record<string, any>;
  userEnvInfo: {
    browserName: string;
    browserVersion: string;
    osName: string;
    uid: string;
    pageTitle: string;
    referrer: string;
    deviceType: string;
    language: string;
    timezone: string;
  };
}

interface Application {
  projectId: string;
  name: string;
}

export function Events() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventItem[]>([]);
  const [searchKey, setSearchKey] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [browser, setBrowser] = useState<string>('');
  const [os, setOs] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 默认最近7天
    new Date()
  ]);
  const navigate = useNavigate();

  // 获取所有可用的浏览器和操作系统选项
  const getBrowserOptions = () => {
    const browsers = [...new Set(data.map(item => item.userEnvInfo?.browserName).filter(Boolean))];
    return [
      { label: '全部(浏览器)', value: '' },
      ...browsers.map(browser => ({ label: browser, value: browser }))
    ];
  };

  const getOsOptions = () => {
    const systems = [...new Set(data.map(item => item.userEnvInfo?.osName).filter(Boolean))];
    return [
      { label: '全部(操作系统)', value: '' },
      ...systems.map(os => ({ label: os, value: os }))
    ];
  };

  // 添加获取项目选项的函数
  const getProjectOptions = () => {
    const projects = [...new Set(data.map(item => ({
      projectId: item.projectId,
      projectName: item.projectName
    })))];
    
    return [
      { label: '全部应用', value: '' },
      ...projects.map(p => ({ 
        label: p.projectName || p.projectId, 
        value: p.projectId 
      }))
    ];
  };

  // 事件名称映射
  const EVENT_NAME_MAP = {
    click_event: '点击事件',
    page_view_event: '页面访问',
    page_leave_event: '页面离开',
    error_event: '错误事件',
    custom_event: '自定义事件'
  };

  type EventNameType = keyof typeof EVENT_NAME_MAP;

  // 列定义
  const columns: PrimaryTableCol<EventItem>[] = [
    {
      title: '事件ID',
      colKey: '_id',
      width: 160,
      fixed: 'left',
      ellipsis: true,
      cell: ({ row }) => (
        <span 
          style={{ cursor: 'pointer' }} 
          onClick={() => {
            navigator.clipboard.writeText(row._id);
            MessagePlugin.success('ID已复制');
          }}
        >
          {row._id}
        </span>
      )
    },
    {
      title: '触发时间',
      colKey: 'createdAt',
      width: 130,
      cell: ({ row }) => new Date(row.createdAt).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
      })
    },
    {
      title: '所属项目',
      colKey: 'projectName',
      width: 200,
      cell: ({ row }) => (
        <Space>
          <Tag theme="primary" variant="light">
            {row.projectName || row.projectId}
          </Tag>
        </Space>
      ),
    },
    // {
    //   title: '事件名称',
    //   colKey: 'eventName',
    //   width: 120,
    //   cell: ({ row }) => EVENT_NAME_MAP[row.eventName as EventNameType] || row.eventName
    // },
    {
      title: '页面标题',
      colKey: 'userEnvInfo.pageTitle',
      width: 200,
      ellipsis: true
    },
    {
      title: '语言/地区',
      colKey: 'locale',
      width: 200,
      cell: ({ row }) => `${row.userEnvInfo.language} / ${row.userEnvInfo.timezone}`
    },
    {
      title: '来源页面',
      colKey: 'userEnvInfo.referrer',
      width: 200,
      ellipsis: true,
      cell: ({ row }) => row.userEnvInfo.referrer || '-'
    },
    {
      title: '用户标识',
      colKey: 'userEnvInfo',
      width: 160,
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
      width: 200,
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
      align: 'left',
      cell: ({ row }) => (
        <Space size={8}>
          <Button
            theme="primary"
            variant="text"
            size="small"
            icon={<BrowseIcon />}
            onClick={() => navigate(`/events/${row._id}`)}
          >
            详情
          </Button>
          <Button
            theme="danger"
            variant="text"
            size="small"
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
      const [startDate, endDate] = dateRange;
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // 使用 request 工具替换 axios
      const response = await request.get('/api/track/list', { params });
      
      // 获取所有涉及的项目信息
      const projectIds = [...new Set(response.map((event: EventItem) => event.projectId))];
      const projectsResponse = await request.get<any, Application[]>('/api/app/list');
      const projectMap = new Map(projectsResponse.map((p: Application) => [p.projectId, p.name]));
      
      // 添加项目名称到事件数据
      const eventsWithProject = response.map((event: EventItem) => ({
        ...event,
        projectName: projectMap.get(event.projectId)
      }));
      
      setData(eventsWithProject);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      MessagePlugin.error('获取事件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateRange]);

  // 修改筛选逻辑
  const filteredData = data.filter(item => {
    return (
      (searchKey ? item._id.includes(searchKey) : true) &&
      (projectId ? item.projectId === projectId : true) &&  // 使用项目ID筛选
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
              <Row gutter={[16, 16]} align="middle" style={{ overflow: 'auto', flexWrap: 'nowrap' }}>
                <Col flex="250px">
                  <Input
                    value={searchKey}
                    onChange={setSearchKey}
                    placeholder="搜索 Event ID"
                    prefixIcon={<SearchIcon />}
                  />
                </Col>
                <Col flex="160px">
                  <Select
                    value={projectId}
                    onChange={(value) => setProjectId(value as string)}
                    placeholder="选择应用"
                    options={getProjectOptions()}
                  />
                </Col>
                <Col flex="160px">
                  <Select
                    value={browser}
                    onChange={(value) => setBrowser(value as string)}
                    placeholder="浏览器"
                    options={getBrowserOptions()}
                  />
                </Col>
                <Col flex="160px">
                  <Select
                    value={os}
                    onChange={(value) => setOs(value as string)}
                    placeholder="操作系统"
                    options={getOsOptions()}
                  />
                </Col>
                <Col flex="260px">
                  <DateRangePicker
                    value={dateRange}
                    onChange={(value) => {
                      if (Array.isArray(value) && value.length === 2) {
                        setDateRange([new Date(value[0]), new Date(value[1])] as [Date, Date]);
                      }
                    }}
                    style={{ width: '100%' }}
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