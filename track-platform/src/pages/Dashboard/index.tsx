import React, { useState, useEffect } from 'react';
import { Card, MessagePlugin, Row, Col, DateRangePicker } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';
import { DashboardIcon, UserIcon, TimeIcon, AppIcon } from 'tdesign-icons-react';

export function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const response = await fetch(`/api/track/stats?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      MessagePlugin.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const getTrendOption = () => {
    // 确保所有日期都有数据，没有数据的填充0
    const dates = [...new Set(stats.trends?.map((item: any) => item._id.date))].sort();
    const eventTypes = ['click_event', 'page_view_event', 'custom_event'];
    const series = eventTypes.map(type => ({
      name: getEventTypeName(type),
      type: 'line',
      smooth: true,
      data: dates.map(date => {
        const item = stats.trends?.find(
          (t: any) => t._id.date === date && t._id.eventName === type
        );
        return item?.count || 0;
      })
    }));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            result += `${param.seriesName}: ${param.value}次<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: eventTypes.map(getEventTypeName)
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '事件次数'
      },
      series
    };
  };

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
        {/* 统计卡片 */}
        <Col span={6}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>总事件数</span>
                <DashboardIcon />
              </div>
              <div className="dashboard-card__count">{stats.totalEvents || 0}</div>
              <div className="dashboard-card__trend">
                较昨日 <span className={stats.eventsTrend >= 0 ? 'trend-up' : 'trend-down'}>
                  {stats.eventsTrend || 0}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>独立用户数</span>
                <UserIcon />
              </div>
              <div className="dashboard-card__count">{stats.uniqueUsers || 0}</div>
              <div className="dashboard-card__trend">
                较昨日 <span className={stats.usersTrend >= 0 ? 'trend-up' : 'trend-down'}>
                  {stats.usersTrend || 0}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
        {/* ... 类似的其他两个统计卡片 ... */}

        {/* 趋势图 */}
        <Col span={12}>
          <div className="chart-panel">
            <div className="chart-header">
              <h4>事件趋势</h4>
              <DateRangePicker
                value={dateRange}
                onChange={(value) => setDateRange(value as [Date, Date])}
                style={{ width: 240 }}
              />
            </div>
            <ReactECharts option={getTrendOption()} style={{ height: 400 }} />
          </div>
        </Col>

        {/* 分布图表行 */}
        <Col span={4}>
          <div className="chart-panel">
            <h4>事件类型分布</h4>
            <ReactECharts option={getPieOption(stats.eventTypes, '')} style={{ height: 320 }} />
          </div>
        </Col>
        <Col span={4}>
          <div className="chart-panel">
            <h4>浏览器分布</h4>
            <ReactECharts option={getPieOption(stats.browsers, '')} style={{ height: 320 }} />
          </div>
        </Col>
        <Col span={4}>
          <div className="chart-panel">
            <h4>操作系统分布</h4>
            <ReactECharts option={getPieOption(stats.os, '')} style={{ height: 320 }} />
          </div>
        </Col>
      </Row>
    </div>
  );
} 