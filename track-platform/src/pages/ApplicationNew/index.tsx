import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, MessagePlugin } from 'tdesign-react';
import axios from 'axios';

const { FormItem } = Form;

interface CreateResponse {
  id: string;
}

export function ApplicationNew() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      const response = await axios.post<CreateResponse>('/api/app', values);
      MessagePlugin.success('创建成功');
      navigate(`/applications/${response.data.id}`);
    } catch (error) {
      MessagePlugin.error('创建失败');
    }
  };

  return (
    <div className="application-new">
      <Card title="创建新应用">
        <Form form={form} onSubmit={handleSubmit}>
          <FormItem label="应用ID" name="projectId" rules={[{ required: true }]}>
            <Input placeholder="请输入应用ID" />
          </FormItem>
          <FormItem label="名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入应用名称" />
          </FormItem>
          <FormItem label="描述" name="description">
            <Input placeholder="请输入应用描述" />
          </FormItem>
          <FormItem>
            <Button theme="primary" type="submit">创建</Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
} 