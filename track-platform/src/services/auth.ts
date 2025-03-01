import request from '../utils/request';
import { LoginForm, LoginResponse } from '../types/auth';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export const login = async (data: LoginForm): Promise<LoginResponse> => {
  const response = await request.post<LoginForm, LoginResponse>('/api/users/login', data);
  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const initAuthToken = () => {
  const token = getAuthToken();
  if (!token) {
    clearAuthToken();
  }
};

export async function getCurrentUser(): Promise<User> {
  const response = await request.get('/api/users/me');
  return response.data;
}

export async function logout() {
  return request.post('/api/auth/logout');
} 