import express from 'express';
import cors from 'cors';
import { trackRouter } from './routes/track';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { appRouter } from './routes/app';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/track-point';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/track', trackRouter);
app.use('/api/app', appRouter);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  }); 