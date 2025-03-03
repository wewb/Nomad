import React, { useState } from 'react';
import { Form, Input, Button, MessagePlugin, SubmitContext, Divider } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { login, setAuthToken, getAuthToken } from '../../services/auth';
import { LoginForm } from '../../types/auth';
import { LockOnIcon, UserIcon } from 'tdesign-icons-react';
import styles from './Login.module.less';

const { FormItem } = Form;

export function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ctx: SubmitContext<any>) => {
    if (ctx.validateResult === true) {
      try {
        setLoading(true);
        const values = form.getFieldsValue(['email', 'password']) as unknown as LoginForm;
        
        const response = await login(values);
        
        // 确保 token 已保存
        const savedToken = getAuthToken();
        if (!savedToken) {
          MessagePlugin.error('登录失败：无法保存认证信息');
          return;
        }

        MessagePlugin.success('登录成功');
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
        MessagePlugin.error('登录失败：用户名或密码错误');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>
            <img src="/src/assets/logo.png" alt="Track Platform" />
          </div>
          <h1>Track Platform</h1>
          <p className={styles.subtitle}>数据追踪与分析平台</p>
        </div>
        
        <Divider />
        
        <Form 
          form={form} 
          onSubmit={handleSubmit}
          labelWidth={0}
          className={styles.loginForm}
        >
          <FormItem name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input 
              size="large" 
              placeholder="邮箱" 
              prefixIcon={<UserIcon />}
            />
          </FormItem>
          <FormItem name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input 
              size="large" 
              type="password" 
              placeholder="密码" 
              prefixIcon={<LockOnIcon />}
            />
          </FormItem>
          <Button 
            theme="primary" 
            type="submit" 
            block 
            size="large"
            loading={loading}
          >
            登录
          </Button>
        </Form>
        
        <div className={styles.loginFooter}>
          <p>© 2025 Track Platform. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
} 