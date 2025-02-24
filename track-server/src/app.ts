import express from 'express';
import cors from 'cors';
import { trackRouter } from './routes/track';

const app = express();

// 启用 CORS
app.use(cors());
app.use(express.json());
app.use('/track', trackRouter);

export default app; 