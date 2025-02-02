import React from 'react';
import { Card, Row, Col } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';
import 'tdesign-react/es/style/index.css';

const Dashboard: React.FC = () => {
  // 示例数据
  const data = [
    { date: '2024-01', value: 3 },
    { date: '2024-02', value: 4 },
    { date: '2024-03', value: 6 },
    { date: '2024-04', value: 5 },
    { date: '2024-05', value: 7 },
  ];

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Events',
        type: 'line',
        smooth: true,
        data: data.map(item => item.value),
        areaStyle: {
          opacity: 0.1,
        },
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          borderWidth: 2,
        },
      },
    ],
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Total Events" bordered>
            <h2>1,234</h2>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Active Users" bordered>
            <h2>567</h2>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Error Rate" bordered>
            <h2>0.5%</h2>
          </Card>
        </Col>
      </Row>
      <Card title="Event Trends" style={{ marginTop: 16 }} bordered>
        <ReactECharts 
          option={option}
          style={{ height: 400 }}
          opts={{ renderer: 'svg' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 