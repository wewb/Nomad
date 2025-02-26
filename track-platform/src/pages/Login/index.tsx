import React from 'react';
import { Form, Input, Button, MessagePlugin, SubmitContext } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';
import { login, setAuthToken, getAuthToken } from '../../services/auth';
import { LoginForm } from '../../types/auth';
import styles from './Login.module.less';

const { FormItem } = Form;

export function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (ctx: SubmitContext<any>) => {
    if (ctx.validateResult === true) {
      try {
        const values = form.getFieldsValue(['email', 'password']) as unknown as LoginForm;
        console.log('Login attempt with:', values);
        
        const response = await login(values);
        console.log('Login successful, response:', response);
        
        // 确保 token 已保存
        const savedToken = getAuthToken();
        if (!savedToken) {
          console.error('Token not saved after login');
          MessagePlugin.error('登录失败：无法保存认证信息');
          return;
        }

        MessagePlugin.success('登录成功');
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>登录</h2>
        <Form 
          form={form} 
          onSubmit={handleSubmit}
          labelWidth={0}
        >
          <FormItem name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input size="large" placeholder="邮箱" />
          </FormItem>
          <FormItem name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input size="large" type="password" placeholder="密码" />
          </FormItem>
          <Button theme="primary" type="submit" block size="large">
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
} 