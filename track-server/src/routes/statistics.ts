import express, { Request, Response } from 'express';
import { Event } from '../models/Event';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/dashboard', auth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const user = req.user;
    const query: any = {};

    if (user?.role !== 'admin') {
      query.projectId = { $in: user?.accessibleProjects || [] };
    }

    // 使用 query 进行统计查询
    const stats = await Event.aggregate([
      { $match: query },
      // ... 其他统计逻辑
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export const statisticsRouter = router; 