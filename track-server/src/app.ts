import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import { applicationRouter } from './routes/application';
import { trackRouter } from './routes/track';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/users', userRouter);
app.use('/api/app', applicationRouter);
app.use('/api/track', trackRouter);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app; 