import axios from 'axios';
import { MessagePlugin } from 'tdesign-react';

// 创建 axios 实例
const instance = axios.create({
  baseURL: 'http://localhost:3000',  // 不需要额外的斜杠
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: any) => {
    console.log('Response:', response);  // 添加日志
    return response.data;
  },
  (error) => {
    console.error('Response error:', error.response || error);  // 添加错误日志
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    MessagePlugin.error(error.response?.data?.error || '请求失败');
    return Promise.reject(error);
  }
);

const request = instance as unknown as {
  get<T = any, R = T>(url: string, config?: any): Promise<R>;
  post<T = any, R = T>(url: string, data?: T): Promise<R>;
  put<T = any, R = T>(url: string, data?: T): Promise<R>;
  delete<T = any, R = T>(url: string): Promise<R>;
};

export default request; 