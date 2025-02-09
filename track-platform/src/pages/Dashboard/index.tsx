import React, { useState, useEffect } from 'react';
import { Card, MessagePlugin } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';

export function Dashboard() {
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/track/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received data:', data); // 添加日志
      setEventData(data);
    } catch (error) {
      console.error('Failed to fetch event data:', error);
      MessagePlugin.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, []);

  const getChartOption = () => ({
    title: {
      text: '事件趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: eventData.map((item: any) => item._id.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '事件数',
      type: 'line',
      data: eventData.map((item: any) => item.count)
    }]
  });

  return (
    <div className="dashboard">
      <Card title="事件统计" loading={loading}>
        {eventData.length > 0 ? (
          <ReactECharts option={getChartOption()} />
        ) : (
          <div>暂无数据</div>
        )}
      </Card>
    </div>
  );
} 