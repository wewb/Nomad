import React, { useState, useEffect } from 'react';
import { Card, MessagePlugin, Row, Col, DateRangePicker } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';
import { DashboardIcon, UserIcon, AppIcon } from 'tdesign-icons-react';
import axios from 'axios';
import { ChartIcon, BrowseIcon, CodeIcon } from 'tdesign-icons-react';

interface Event {
  data: {
    events?: Array<{ type: string }>;
  };
  createdAt: string;
  userEnvInfo?: {
    uid: string;
  };
}

interface StatsResponse {
  events: Event[];
  totalEvents: number;
  uniqueUsers: number;
  eventTypes: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    uniqueUsers: 0,
    pageViews: 0,
    errorCount: 0
  });
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const [startDate, endDate] = dateRange;
      const response = await axios.get('/api/track/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      const { events, totalEvents, uniqueUsers, eventTypes, browsers, os } = response.data as StatsResponse;

      // 统计页面访问和错误数
      const pageViews = events.reduce((count: number, event: any) => 
        count + (event.data.events?.filter((e: any) => e.type === 'view').length || 0), 0);
      
      const errorCount = events.reduce((count: number, event: any) => 
        count + (event.data.events?.filter((e: any) => e.type === 'error').length || 0), 0);

      setStats({
        totalEvents,
        uniqueUsers,
        pageViews,
        errorCount
      });

      // 处理趋势数据
      const trend = events.reduce((acc: any, event: any) => {
        const date = new Date(event.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setTrendData(Object.entries(trend).map(([date, count]) => ({
        date,
        count: count as number
      })));

    } catch (error) {
      console.error('Failed to fetch stats:', error);
      MessagePlugin.error('获取统计数据失败');
    }
  };

  const getTrendOption = () => ({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '事件数',
        type: 'line',
        smooth: true,
        data: trendData.map(item => item.count),
        areaStyle: {
          opacity: 0.1
        }
      }
    ]
  });

  const getPieOption = (data: any[], title: string) => {
    const formattedData = data?.map((item: any) => ({
      name: getEventTypeName(item._id),
      value: item.count
    })) || [];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: '70%',
        data: formattedData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 事件类型名称映射
  const getEventTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'click_event': '点击事件',
      'page_view_event': '页面访问',
      'custom_event': '自定义事件',
      'chrome': 'Chrome',
      'firefox': 'Firefox',
      'safari': 'Safari',
      'edge': 'Edge',
      'other': '其他',
      'windows': 'Windows',
      'macos': 'MacOS',
      'linux': 'Linux',
      'ios': 'iOS',
      'android': 'Android'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col span={3}>
          <Card className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>总事件数</span>
                <ChartIcon />
              </div>
              <div className="dashboard-card__count">{stats.totalEvents}</div>
            </div>
          </Card>
        </Col>
        <Col span={3}>
          <Card className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>访问人数</span>
                <UserIcon />
              </div>
              <div className="dashboard-card__count">{stats.uniqueUsers}</div>
            </div>
          </Card>
        </Col>
        <Col span={3}>
          <Card className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>页面访问</span>
                <BrowseIcon />
              </div>
              <div className="dashboard-card__count">{stats.pageViews}</div>
            </div>
          </Card>
        </Col>
        <Col span={3}>
          <Card className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>错误数</span>
                <CodeIcon />
              </div>
              <div className="dashboard-card__count">{stats.errorCount}</div>
            </div>
          </Card>
        </Col>
        </Row>
        <Row gutter={[16, 16]}>
        {/* 事件趋势图表 */}
        <Col span={12}>
          <Card>
            <div className="chart-header">
              <h4>事件趋势</h4>
              <DateRangePicker
                value={dateRange}
                onChange={(value) => {
                  if (Array.isArray(value) && value.length === 2) {
                    setDateRange([new Date(value[0]), new Date(value[1])]);
                  }
                }}
              />
            </div>
            <ReactECharts option={getTrendOption()} style={{ height: 400 }} />
          </Card>
        </Col>
        </Row>
    </div>
  );
} 