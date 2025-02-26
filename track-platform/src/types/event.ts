export interface Event {
  _id: string;
  projectId: string;
  type: string;
  data: any;
  userEnvInfo: {
    userAgent: string;
    ip?: string;
    location?: string;
  };
  createdAt: string;
} 