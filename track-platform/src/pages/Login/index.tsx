import { Form, Input, Button, MessagePlugin } from 'tdesign-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.less';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 实现登录逻辑
      localStorage.setItem('token', 'demo-token');
      MessagePlugin.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      MessagePlugin.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Form onSubmit={onSubmit} className={styles.loginForm}>
        <h2>Track Platform</h2>
        <Form.FormItem name="username" rules={[{ required: true }]}>
          <Input placeholder="用户名" />
        </Form.FormItem>
        <Form.FormItem name="password" rules={[{ required: true }]}>
          <Input type="password" placeholder="密码" />
        </Form.FormItem>
        <Button block loading={loading} type="submit">
          登录
        </Button>
      </Form>
    </div>
  );
} 