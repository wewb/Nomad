import React, { useState, useEffect } from 'react';
import { Card, MessagePlugin, Row, Col, DateRangePicker } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';
import { DashboardIcon, UserIcon, AppIcon } from 'tdesign-icons-react';

export function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [totalStats, setTotalStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date()
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 获取时间范围内的统计
      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });
      
      const [rangeResponse, totalResponse] = await Promise.all([
        fetch(`/api/track/stats?${params}`),
        fetch('/api/track/stats/total')  // 新增的总体统计接口
      ]);

      if (!rangeResponse.ok || !totalResponse.ok) {
        throw new Error('Failed to fetch stats');
      }

      const [rangeData, totalData] = await Promise.all([
        rangeResponse.json(),
        totalResponse.json()
      ]);

      setStats(rangeData);
      setTotalStats(totalData);
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
        <Col span={4}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>总事件数</span>
                <DashboardIcon />
              </div>
              <div className="dashboard-card__count">{totalStats.totalEvents || 0}</div>
              <div className="dashboard-card__trend">
                所选时间段: {stats.totalEvents || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>总用户数</span>
                <UserIcon />
              </div>
              <div className="dashboard-card__count">{totalStats.uniqueUsers || 0}</div>
              <div className="dashboard-card__trend">
                所选时间段: {stats.uniqueUsers || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__inner">
              <div className="dashboard-card__title">
                <span>活跃应用数</span>
                <AppIcon />
              </div>
              <div className="dashboard-card__count">{stats.activeApps || 0}</div>
              <div className="dashboard-card__trend">
                所选时间段内
              </div>
            </div>
          </Card>
        </Col>

        {/* 趋势图 */}
        <Col span={12}>
          <div className="chart-panel">
            <div className="chart-header">
              <h4>事件趋势(所选时间段)</h4>
              <DateRangePicker
                value={dateRange}
                onChange={(value) => {
                  if (Array.isArray(value) && value.length === 2) {
                    setDateRange([new Date(value[0]), new Date(value[1])] as [Date, Date]);
                  }
                }}
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