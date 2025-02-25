import express from 'express';
import cors from 'cors';
import { trackRouter } from './routes/track';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { applicationRouter } from './routes/application';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/track-point';

// 基础中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    referer: req.headers.referer,
    // 只在 POST 请求时显示 body
    ...(req.method === 'POST' ? { body: req.body } : {}),
    // 只在调试时显示数据库状态
    ...(process.env.NODE_ENV === 'development' ? { mongoState: mongoose.connection.readyState } : {})
  });
  next();
});

// 路由
app.use('/api/track', trackRouter);
app.use('/api/app', applicationRouter);

async function startServer() {
  try {
    // 等待 MongoDB 连接成功
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 设置连接监听器
    mongoose.connection.on('disconnected', async () => {
      console.log('Lost MongoDB connection... Retrying...');
      try {
        await mongoose.connect(MONGODB_URI);
        console.log('Reconnected to MongoDB');
      } catch (err) {
        console.error('Failed to reconnect:', err);
      }
    });

    // 启动 HTTP 服务器
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer().catch(console.error);

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}); 