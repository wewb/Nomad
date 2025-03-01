export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  _id: {
    $oid: string;
  };
  email: string;
  role: string;
  apiKey: string | null;
  isActive: boolean;
  accessibleProjects: string[];
  createdAt: string;
  updatedAt: string;
} 