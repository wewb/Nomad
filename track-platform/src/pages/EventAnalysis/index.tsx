import React, { useState, useEffect, useMemo } from 'react';
import { Table, DateRangePicker, Card, MessagePlugin, Row, Col, Select, SelectValue } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import { useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import request from '../../utils/request';
import { formatDate } from '../../utils/date';

interface EventAnalysisData {
  eventStats: Array<{
    eventName: string;
    eventType: string;
    customParams?: Record<string, any>;
    count: number;
    uniqueUsers: number;
    avgDuration: number;
    lastTriggered: string;
  }>;
  userBehavior: {
    totalUsers: number;
    avgSessionsPerUser: number;
    avgSessionDuration: number;
    avgPageViewsPerSession: number;
  };
  sourceAnalysis: {
    referrers: Array<{
      source: string;
      visits: number;
      uniqueUsers: number;
    }>;
    browsers: Array<{
      name: string;
      version: string;
      count: number;
    }>;
    devices: Array<{
      type: string;
      os: string;
      count: number;
    }>;
    languages: Array<{
      code: string;
      count: number;
    }>;
  };
  behaviorTrends: Array<{
    date: string;
    visits: number;
    users: number;
    pageViews: number;
  }>;
}

export function EventAnalysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventAnalysisData | null>({
    eventStats: [],
    userBehavior: {
      totalUsers: 0,
      avgSessionsPerUser: 0,
      avgSessionDuration: 0,
      avgPageViewsPerSession: 0
    },
    sourceAnalysis: {
      referrers: [],
      browsers: [],
      devices: [],
      languages: []
    },
    behaviorTrends: []
  });
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedCustomType, setSelectedCustomType] = useState<string>('all');
  const customEventTypes = useMemo(() => {
    if (!data?.eventStats) return [];
    return Array.from(new Set(
      data.eventStats
        .filter(event => event.eventType === 'custom')
        .map(event => event.eventName)
    ));
  }, [data?.eventStats]);

  const fetchEventAnalysis = async () => {
    setLoading(true);
    try {
      const response = await request.get<EventAnalysisData>(`/api/statistics/${projectId}/events`, {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString()
        }
      });
      setData(response);
    } catch (error) {
      MessagePlugin.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAnalysis();
  }, [dateRange, projectId]);

  const columns: PrimaryTableCol<EventAnalysisData['eventStats'][0]>[] = [
    {
      title: '事件名称',
      colKey: 'eventName',
      width: 200,
      render: ({ row }) => {
        if (row.eventType === 'custom') {
          return (
            <div>
              {row.eventName}
              <div style={{ fontSize: '12px', color: 'var(--td-text-color-secondary)' }}>
                {JSON.stringify(row.customParams)}
              </div>
            </div>
          );
        }
        return row.eventName;
      },
    },
    {
      title: '触发次数',
      colKey: 'count',
      width: 120,
      align: 'right',
    },
    {
      title: '独立用户数',
      colKey: 'uniqueUsers',
      width: 120,
      align: 'right',
    },
    {
      title: '平均触发间隔',
      colKey: 'avgDuration',
      width: 150,
      align: 'right',
      render: ({ row }) => (row.avgDuration ? `${row.avgDuration.toFixed(2)}毫秒` : '-'),
    },
    {
      title: '最近触发时间',
      colKey: 'lastTriggered',
      width: 180,
      render: ({ row }) => formatDate(row.lastTriggered),
    },
  ];

  return (
    <div className="event-analysis">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="分析数据概览" bordered>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col>
                <DateRangePicker
                  value={dateRange}
                  onChange={(value) => setDateRange(value as [Date, Date])}
                  style={{ width: 240 }}
                />
              </Col>
              <Col flex="auto">
                <Row gutter={[24, 16]} justify="end">
                <Col>
                    <div className="stat-item">
                      <div className="stat-label"></div>
                      <div className="stat-value">
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label">总用户数</div>
                      <div className="stat-value">{data?.userBehavior.totalUsers || 0}</div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label">平均会话数/用户</div>
                      <div className="stat-value">
                        {data?.userBehavior.avgSessionsPerUser.toFixed(2) || 0}
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label">平均会话时长</div>
                      <div className="stat-value">
                        {data?.userBehavior.avgSessionDuration.toFixed(2) || 0}毫秒
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label">平均页面浏览量/会话</div>
                      <div className="stat-value">
                        {data?.userBehavior.avgPageViewsPerSession.toFixed(2) || 0}
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label"></div>
                      <div className="stat-value">
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <div className="stat-label"></div>
                      <div className="stat-value">
                      </div>
                    </div>
                  </Col>
                  <Col></Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="事件分析" bordered>
            <div style={{ marginBottom: 16 }}>
              <Select
                value={selectedCustomType}
                onChange={(value: SelectValue) => setSelectedCustomType(value as string)}
                style={{ width: 200 }}
                placeholder="选择自定义事件类型"
              >
                <Select.Option value="all">全部</Select.Option>
                {customEventTypes.map(type => (
                  <Select.Option key={type} value={type}>{type}</Select.Option>
                ))}
              </Select>
            </div>
            <Table
              loading={loading}
              data={data?.eventStats?.filter(event => 
                selectedCustomType === 'all' || 
                event.eventName === selectedCustomType
              ) || []}
              columns={columns}
              rowKey="eventName"
              hover
              stripe
              style={{ width: '100%' }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="访问详情分析" bordered>
            <Row gutter={[24, 24]} justify="space-between">
              <Col span={12}>
                <Card 
                  title="来源分布" 
                  bordered 
                  className="analysis-card"
                >
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item',
                        formatter: (params: any) => {
                          const { name, value, percent } = params;
                          return `${name}<br/>访问量: ${value}<br/>占比: ${percent}%<br/>`;
                        }
                      },
                      legend: {
                        orient: 'vertical',
                        right: 10,
                        top: 'center'
                      },
                      series: [{
                        type: 'pie',
                        radius: ['50%', '70%'],
                        avoidLabelOverlap: true,
                        label: {
                          show: true,
                          formatter: '{b}: {c} ({d}%)'
                        },
                        data: data?.sourceAnalysis?.referrers?.map(item => ({
                          name: item.source || '[本机浏览]',
                          value: item.visits,
                          itemStyle: { borderRadius: 4 }
                        }))?.sort((a, b) => b.value - a.value) || []
                      }]
                    }}
                    style={{ height: 320 }}
                  />
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="浏览器分布" 
                  bordered 
                  className="analysis-card"
                >
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item',
                        formatter: '{b}: {c} ({d}%)'
                      },
                      series: [{
                        type: 'pie',
                        radius: '70%',
                        data: data?.sourceAnalysis.browsers.map(item => ({
                          name: `${item.name} ${item.version}`,
                          value: item.count
                        })).sort((a, b) => b.value - a.value) || []
                      }]
                    }}
                    style={{ height: 300 }}
                  />
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="设备分布" 
                  bordered 
                  className="analysis-card"
                >
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item'
                      },
                      series: [{
                        type: 'pie',
                        radius: '70%',
                        data: data?.sourceAnalysis.devices.map(item => ({
                          name: `${item.type} (${item.os})`,
                          value: item.count
                        })).sort((a, b) => b.value - a.value) || []
                      }]
                    }}
                    style={{ height: 300 }}
                  />
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="语言分布" 
                  bordered 
                  className="analysis-card"
                >
                  <ReactECharts
                    option={{
                      tooltip: {
                        trigger: 'item'
                      },
                      series: [{
                        type: 'pie',
                        radius: '70%',
                        data: data?.sourceAnalysis.languages.map(item => ({
                          name: new Intl.DisplayNames(['zh'], { type: 'language' }).of(item.code) || item.code,
                          value: item.count
                        })).sort((a, b) => b.value - a.value) || []
                      }]
                    }}
                    style={{ height: 300 }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="用户行为趋势" bordered>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow'
                  }
                },
                legend: {
                  data: ['访问量', '用户数', '页面浏览量']
                },
                xAxis: {
                  type: 'category',
                  data: data?.behaviorTrends?.map(item => item.date) || []
                },
                yAxis: {
                  type: 'value'
                },
                series: [
                  {
                    name: '访问量',
                    type: 'bar',
                    data: data?.behaviorTrends?.map(item => item.visits) || []
                  },
                  {
                    name: '用户数',
                    type: 'bar',
                    data: data?.behaviorTrends?.map(item => item.users) || []
                  },
                  {
                    name: '页面浏览量',
                    type: 'bar',
                    data: data?.behaviorTrends?.map(item => item.pageViews) || []
                  }
                ]
              }}
              style={{ height: 400 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 