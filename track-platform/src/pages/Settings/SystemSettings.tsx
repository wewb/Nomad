import React from 'react';
import { Card, Form, Input, Button, MessagePlugin } from 'tdesign-react';

const { FormItem } = Form;

export function SystemSettings() {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      // TODO: 实现系统设置保存
      MessagePlugin.success('保存成功');
    } catch (error) {
      MessagePlugin.error('保存失败');
    }
  };

  return (
    <div className="system-settings">
      <Card title="系统设置">
        <Form form={form} onSubmit={handleSubmit}>
          <FormItem label="系统名称" name="systemName">
            <Input />
          </FormItem>
          <FormItem label="数据保留天数" name="dataRetentionDays">
            <Input type="number" />
          </FormItem>
          <FormItem>
            <Button theme="primary" type="submit">
              保存设置
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
} 