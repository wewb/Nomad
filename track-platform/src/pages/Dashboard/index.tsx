import React from 'react';
import { Card, Row, Col } from 'antd';
import { Line } from '@ant-design/charts';
import 'antd/dist/antd.css';

const Dashboard: React.FC = () => {
  // 示例数据
  const data = [
    { date: '2024-01', value: 3 },
    { date: '2024-02', value: 4 },
    { date: '2024-03', value: 6 },
    { date: '2024-04', value: 5 },
    { date: '2024-05', value: 7 },
  ];

  const config = {
    data,
    padding: 'auto',
    xField: 'date',
    yField: 'value',
    xAxis: {
      type: 'time',
    },
    smooth: true,
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Total Events">
            <h2>1,234</h2>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Active Users">
            <h2>567</h2>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Error Rate">
            <h2>0.5%</h2>
          </Card>
        </Col>
      </Row>
      <Card title="Event Trends" style={{ marginTop: 16 }}>
        <Line {...config} />
      </Card>
    </div>
  );
};

export default Dashboard; 