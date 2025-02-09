import express from 'express';
import cors from 'cors';
import { trackRouter } from './routes/track';
import { connectDB } from './db';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],  // 添加平台的地址
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/track', trackRouter);

// Connect to MongoDB
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
}); 