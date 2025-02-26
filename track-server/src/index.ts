import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './db';
import { applicationRouter } from './routes/application';
import userRouter from './routes/user';
import { trackRouter } from './routes/track';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 创建 Express 应用
const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/users', userRouter);
app.use('/api/app', applicationRouter);
app.use('/api/track', trackRouter);

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  try {
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer(); 