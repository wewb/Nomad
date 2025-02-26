import React from 'react';
import { Card, Table, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';

export function ApiSettings() {
  const columns: PrimaryTableCol[] = [
    { title: '接口名称', colKey: 'name' },
    { title: '请求方式', colKey: 'method' },
    { title: '接口路径', colKey: 'path' },
    { title: '所需权限', colKey: 'permission' },
    { title: '状态', colKey: 'status' },
  ];

  const apiList = [
    {
      name: '事件上报',
      method: 'POST',
      path: '/track',
      permission: 'API Key',
      status: '正常',
    },
    // ... 其他 API 列表
  ];

  return (
    <div className="api-settings">
      <Card title="API 接口列表">
        <Table
          data={apiList}
          columns={columns}
          rowKey="path"
          hover
        />
      </Card>
    </div>
  );
} 