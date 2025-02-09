import express from 'express';
import { trackRouter } from './routes/track';

const app = express();

app.use(express.json());
app.use('/api/track', trackRouter);

export default app; 