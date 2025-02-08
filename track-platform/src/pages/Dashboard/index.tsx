import { Card } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';
import { useState, useEffect } from 'react';

export function Dashboard() {
  const [eventData, setEventData] = useState([]);

  const fetchEventData = async () => {
    try {
      const response = await fetch('/api/track/stats');
      const data = await response.json();
      setEventData(data);
    } catch (error) {
      console.error('Failed to fetch event data:', error);
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
      type: 'time'
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '事件数',
      type: 'line',
      data: eventData
    }]
  });

  return (
    <div className="dashboard">
      <Card title="事件统计">
        <ReactECharts option={getChartOption()} />
      </Card>
    </div>
  );
} 