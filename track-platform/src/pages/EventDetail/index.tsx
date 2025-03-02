import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Loading, Tag, Row, Col, Descriptions, Button } from 'tdesign-react';
import { RollbackIcon, BrowseIcon, DesktopIcon, MapInformation2Icon, TimeIcon } from 'tdesign-icons-react';
import request from '../../utils/request';
import { formatDateTime } from '../../utils/date';
import './style.less';

interface EventDetail {
  _id: string;
  projectId: string;
  type: string;
  data: {
    pageUrl: string;
    pageTitle: string;
    referrer: string;
    events: Array<{
      type: string;
      timestamp: number;
      data: any;
      _id: string;
    }>;
  };
  userEnvInfo: {
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
    deviceType: string;
    screenResolution: string;
    language: string;
    timezone: string;
    userAgent: string;
    languageRaw: string;
    referrer: string;
    pageTitle: string;
  };
  createdAt: string;
  updatedAt: string;
}

type TagTheme = 'primary' | 'warning' | 'success' | 'danger' | 'default';

const EVENT_TYPE_MAP: Record<string, { text: string; color: TagTheme }> = {
  view: { text: '页面访问', color: 'primary' },
  click: { text: '点击事件', color: 'warning' },
  custom: { text: '自定义事件', color: 'success' },
  leave: { text: '页面离开', color: 'danger' },
  error: { text: '错误事件', color: 'danger' }
};

// 格式化用户环境信息
const formatUserEnvInfo = (userEnvInfo: any) => {
  if (!userEnvInfo) return null;
  
  // 浏览器和系统信息
  const browserInfo = {
    browserName: userEnvInfo.browserName || '未知',
    browserVersion: userEnvInfo.browserVersion || '未知',
    userAgent: userEnvInfo.userAgent || '未知'
  };
  
  // 操作系统信息
  const osInfo = {
    osName: userEnvInfo.osName || '未知',
    osVersion: userEnvInfo.osVersion || '未知',
    deviceType: userEnvInfo.deviceType || '未知',
    screenResolution: userEnvInfo.screenResolution || '未知'
  };
  
  // 地区和语言信息
  const regionInfo = {
    language: userEnvInfo.language || '未知',
    languageRaw: userEnvInfo.languageRaw || '未知',
    timezone: userEnvInfo.timezone || '未知',
    referrer: userEnvInfo.referrer || '未知'
  };
  
  // 其他信息
  const otherInfo = {
    pageTitle: userEnvInfo.pageTitle || '未知',
    uid: userEnvInfo.uid || '未知',
    timestamp: userEnvInfo.timestamp 
      ? new Date(userEnvInfo.timestamp).toLocaleString() 
      : '未知'
  };
  
  return { browserInfo, osInfo, regionInfo, otherInfo };
};

// 在渲染部分使用格式化函数
const renderUserEnvInfo = (userEnvInfo: any) => {
  const formattedInfo = formatUserEnvInfo(userEnvInfo);
  if (!formattedInfo) return <p>无用户环境信息</p>;
  
  const { browserInfo, osInfo, regionInfo, otherInfo } = formattedInfo;
  
  const userEnvInfoStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    section: {
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      padding: '12px',
      backgroundColor: '#f9f9f9',
    },
    sectionHeader: {
      marginTop: 0,
      marginBottom: '12px',
      color: '#333',
      fontSize: '16px',
      borderBottom: '1px solid #eee',
      paddingBottom: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '8px',
    },
    item: {
      display: 'flex',
      marginBottom: '4px',
    },
    label: {
      fontWeight: 500,
      minWidth: '120px',
      color: '#666',
    },
    value: {
      color: '#333',
    },
  };

  return (
    <div style={userEnvInfoStyles.container}>
      <div style={userEnvInfoStyles.section}>
        <h4 style={userEnvInfoStyles.sectionHeader}>浏览器信息</h4>
        <div style={userEnvInfoStyles.grid}>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>浏览器：</span>
            <span style={userEnvInfoStyles.value}>{browserInfo.browserName} {browserInfo.browserVersion}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>User Agent：</span>
            <span style={{...userEnvInfoStyles.value, wordBreak: 'break-all'}}>{browserInfo.userAgent}</span>
          </div>
        </div>
      </div>
      
      <div style={userEnvInfoStyles.section}>
        <h4 style={userEnvInfoStyles.sectionHeader}>系统信息</h4>
        <div style={userEnvInfoStyles.grid}>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>操作系统：</span>
            <span style={userEnvInfoStyles.value}>{osInfo.osName} {osInfo.osVersion}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>设备类型：</span>
            <span style={userEnvInfoStyles.value}>{osInfo.deviceType}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>屏幕分辨率：</span>
            <span style={userEnvInfoStyles.value}>{osInfo.screenResolution}</span>
          </div>
        </div>
      </div>
      
      <div style={userEnvInfoStyles.section}>
        <h4 style={userEnvInfoStyles.sectionHeader}>地区信息</h4>
        <div style={userEnvInfoStyles.grid}>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>语言：</span>
            <span style={userEnvInfoStyles.value}>{regionInfo.language}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>时区：</span>
            <span style={userEnvInfoStyles.value}>{regionInfo.timezone}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>来源页面：</span>
            <span style={userEnvInfoStyles.value}>{regionInfo.referrer}</span>
          </div>
        </div>
      </div>
      
      <div style={userEnvInfoStyles.section}>
        <h4 style={userEnvInfoStyles.sectionHeader}>其他信息</h4>
        <div style={userEnvInfoStyles.grid}>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>页面标题：</span>
            <span style={userEnvInfoStyles.value}>{otherInfo.pageTitle}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>用户ID：</span>
            <span style={userEnvInfoStyles.value}>{otherInfo.uid}</span>
          </div>
          <div style={userEnvInfoStyles.item}>
            <span style={userEnvInfoStyles.label}>时间戳：</span>
            <span style={userEnvInfoStyles.value}>{otherInfo.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const response = await request.get<any, EventDetail>(`/api/track/${id}`);
      setEvent(response);
    } catch (error) {
      console.error('Failed to fetch event detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventData = (data: any) => {
    if (!data) return null;
    
    const items = Object.entries(data).map(([key, value]) => (
      <div key={key} className="event-data-item">
        <span className="key">{key}:</span>
        <span className="value">{
          typeof value === 'number' && key.includes('time') 
            ? `${value}ms`
            : String(value)
        }</span>
      </div>
    ));

    return <div className="event-data">{items}</div>;
  };

  const eventColumns = [
    {
      title: '事件类型',
      colKey: 'type',
      width: 120,
      cell: ({ row }: any) => {
        const eventType = EVENT_TYPE_MAP[row.type as keyof typeof EVENT_TYPE_MAP] || { text: row.type, color: 'default' };
        return (
          <Tag theme={eventType.color} variant="light">
            {eventType.text}
          </Tag>
        );
      },
    },
    {
      title: '触发时间',
      colKey: 'timestamp',
      width: 180,
      cell: ({ row }: any) => (
        <div className="time-cell">
          <TimeIcon />
          <span>{formatDateTime(new Date(row.timestamp).toISOString())}</span>
        </div>
      ),
    },
    {
      title: '事件数据',
      colKey: 'data',
      cell: ({ row }: any) => renderEventData(row.data),
    },
  ];

  if (loading) return <Loading loading={true} />;
  if (!event) return <div>事件不存在</div>;

  return (
      <div className="event-detail">
          <div className="header-actions">
              <Button icon={<RollbackIcon />} onClick={() => navigate('/events')}>
                  返回
              </Button>
          </div>
          <br></br>
          <Row gutter={[16, 16]} justify="center">
              <Col xs={24} xl={12}>
                  <Card title="基本信息" bordered className="detail-card">
                      <Descriptions layout="vertical" column={4}>
                          <Descriptions.DescriptionsItem label="事件ID">
                              {event._id}
                          </Descriptions.DescriptionsItem>
                          <Descriptions.DescriptionsItem label="项目ID">{event.projectId}</Descriptions.DescriptionsItem>
                          {/* <Descriptions.DescriptionsItem label="事件类型">
                             <Tag theme="primary" variant="light">{event.type}</Tag>
              </Descriptions.DescriptionsItem> */}
                          <Descriptions.DescriptionsItem label="创建时间">
                              {formatDateTime(event.createdAt)}
                          </Descriptions.DescriptionsItem>
                          <Descriptions.DescriptionsItem label="页面URL" span={2}>
                              <a href={event.data.pageUrl} target="_blank" rel="noopener noreferrer">
                                  {event.data.pageUrl}
                              </a>
                          </Descriptions.DescriptionsItem>
                          <Descriptions.DescriptionsItem label="页面标题" span={2}>
                              {event.data.pageTitle}
                          </Descriptions.DescriptionsItem>
                      </Descriptions>
                  </Card>
              </Col>

        <Col xs={24} xl={12}>
          <Card title="事件序列" bordered className="detail-card event-sequence">
            <Table
              data={event.data.events}
              columns={eventColumns}
              rowKey="_id"
              stripe
              hover
              pagination={{ totalContent: false }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="用户环境信息" bordered className="detail-card">
            {renderUserEnvInfo(event.userEnvInfo)}
          </Card>
        </Col>
      </Row>
    </div>
  );
} 