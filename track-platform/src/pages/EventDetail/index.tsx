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
                          <Descriptions.DescriptionsItem label="事件ID">{event._id}</Descriptions.DescriptionsItem>
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
            <div className="env-info">
              <div className="env-section">
                <div className="env-title">
                  <BrowseIcon /> 浏览器信息
                </div>
                <div className="env-content">
                  <div className="env-item">
                    <span>浏览器：</span>
                    <strong>{event.userEnvInfo.browserName} {event.userEnvInfo.browserVersion}</strong>
                  </div>
                  <div className="env-item">
                    <span>语言：</span>
                    <strong>{event.userEnvInfo.language}</strong>
                  </div>
                </div>
              </div>

              <div className="env-section">
                <div className="env-title">
                  <DesktopIcon /> 系统信息
                </div>
                <div className="env-content">
                  <div className="env-item">
                    <span>操作系统：</span>
                    <strong>{event.userEnvInfo.osName} {event.userEnvInfo.osVersion}</strong>
                  </div>
                  <div className="env-item">
                    <span>设备类型：</span>
                    <strong>{event.userEnvInfo.deviceType}</strong>
                  </div>
                  <div className="env-item">
                    <span>分辨率：</span>
                    <strong>{event.userEnvInfo.screenResolution}</strong>
                  </div>
                </div>
              </div>

              <div className="env-section">
                <div className="env-title">
                  <MapInformation2Icon /> 地区信息
                </div>
                <div className="env-content">
                  <div className="env-item">
                    <span>时区：</span>
                    <strong>{event.userEnvInfo.timezone}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 