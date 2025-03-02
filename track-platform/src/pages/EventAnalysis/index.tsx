import React, { useState, useEffect } from 'react';
import { Table, DateRangePicker, Card, Button, Space, MessagePlugin, Row, Col } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { ChartIcon } from 'tdesign-icons-react';
import ReactECharts from 'echarts-for-react';

interface EventData {
  eventName: string;
  count: number;
  uniqueUsers: number;
  avgDuration: number;
  lastTriggered: string;
}

export function EventAnalysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventData[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
  const navigate = useNavigate();

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const response = await fetch(`/api/track/analysis?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch event data:', error);
      MessagePlugin.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [dateRange]);

  const columns: PrimaryTableCol<EventData>[] = [
    {
      title: '事件名称',
      colKey: 'eventName',
      width: 200,
      align: 'left',
      render: ({ row }) => (
        <Space>
          <span>{getEventDisplayName(row.eventName)}</span>
          <Button
            theme="primary"
            variant="text"
            icon={<ChartIcon />}
            onClick={() => navigate(`/event-analysis/${row.eventName}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
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
      render: ({ row }) => (row.avgDuration ? `${row.avgDuration.toFixed(2)}秒` : '-'),
    },
    {
      title: '最近触发时间',
      colKey: 'lastTriggered',
      width: 180,
    },
  ] as const;

  const getEventDisplayName = (name: string) => {
    const nameMap: Record<string, string> = {
      'click_event': '点击事件',
      'page_view_event': '页面访问',
      'custom_event': '自定义事件',
    };
    return nameMap[name] || name;
  };

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
        <Col span={6}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>总事件数(PV)</span>
                <ChartIcon />
              </div>
              <div className="dashboard-card__count">{data.reduce((sum, item) => sum + item.count, 0)}</div>
              <div className="dashboard-card__trend">
                过去7天
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>独立用户数</span>
                <ChartIcon />
              </div>
              <div className="dashboard-card__count">
                {data.reduce((sum, item) => sum + item.uniqueUsers, 0)}
              </div>
              <div className="dashboard-card__trend">
                过去7天
              </div>
            </div>
          </Card>
        </Col>

        {/* 事件趋势图 */}
        <Col span={24}>
          <div className="chart-panel">
            <div className="chart-header">
              <h4>事件趋势</h4>
              <DateRangePicker
                value={dateRange}
                onChange={(value) => setDateRange(value as [Date, Date])}
                style={{ width: 240 }}
              />
            </div>
            <Table
              loading={loading}
              data={data}
              columns={columns}
              rowKey="eventName"
              hover
              stripe
            />
          </div>
        </Col>

        {/* 事件分布图 */}
        <Col span={8}>
          <div className="chart-panel">
            <h4>事件类型分布</h4>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c} ({d}%)'
                },
                series: [{
                  type: 'pie',
                  radius: '70%',
                  data: data.map(item => ({
                    name: getEventDisplayName(item.eventName),
                    value: item.count
                  }))
                }]
              }}
              style={{ height: 320 }}
            />
          </div>
        </Col>

        <Col span={8}>
          <div className="chart-panel">
            <h4>用户分布</h4>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c} ({d}%)'
                },
                series: [{
                  type: 'pie',
                  radius: '70%',
                  data: data.map(item => ({
                    name: getEventDisplayName(item.eventName),
                    value: item.uniqueUsers
                  }))
                }]
              }}
              style={{ height: 320 }}
            />
          </div>
        </Col>

        <Col span={8}>
          <div className="chart-panel">
            <h4>平均触发间隔</h4>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c}秒'
                },
                series: [{
                  type: 'pie',
                  radius: '70%',
                  data: data.map(item => ({
                    name: getEventDisplayName(item.eventName),
                    value: item.avgDuration ? Number(item.avgDuration.toFixed(2)) : 0
                  }))
                }]
              }}
              style={{ height: 320 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
} 