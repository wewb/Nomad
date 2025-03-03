import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user';
import { applicationRouter } from './routes/application';
import { trackRouter } from './routes/track';
import authRouter from './routes/auth';
import { apiRouter } from './routes/api';
import { statisticsRouter } from './routes/statistics';

const app = express();
dotenv.config();

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/users', userRouter);
app.use('/api/app', applicationRouter);
app.use('/api/track', trackRouter);
app.use('/api/auth', authRouter);
app.use('/api/statistics/', statisticsRouter);

app.use('/api-key', apiRouter);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-platform');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

export default app; 