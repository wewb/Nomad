import React from 'react';
import { Card } from 'tdesign-react';
import ReactECharts from 'echarts-for-react';

export function EventAnalysis() {
  return (
    <div className="event-analysis">
      <Card title="事件分析">
        <ReactECharts 
          option={{
            title: { text: '事件分析' },
            // 基础配置
          }} 
        />
      </Card>
    </div>
  );
} 