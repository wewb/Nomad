export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  _id: string;
  email: string;
  role: string;
  apiKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 