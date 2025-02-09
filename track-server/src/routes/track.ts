import express from 'express';
import { Event } from '../models/Event';

const router = express.Router();

// 记录事件
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    if (!eventData.projectId || !eventData.eventName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const event = new Event(eventData);
    await event.save();
    res.status(201).json({ message: 'Event recorded successfully' });
  } catch (error) {
    console.error('Failed to save event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // 事件趋势统计
    const trendStats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            eventName: '$eventName'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // 事件类型分布
    const eventTypeStats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 }
        }
      }
    ]);

    // 用户环境统计
    const browserStats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userEnvInfo.browserName',
          count: { $sum: 1 }
        }
      }
    ]);

    const osStats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userEnvInfo.osName',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      trends: trendStats,
      eventTypes: eventTypeStats,
      browsers: browserStats,
      os: osStats
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 获取事件列表
router.get('/list', async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除事件
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取事件分析数据
router.get('/analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const events = await Event.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
          }
        }
      },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userEnvInfo.uid' },
          lastTriggered: { $max: '$createdAt' },
          timestamps: { $push: '$createdAt' }
        }
      },
      {
        $project: {
          eventName: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          lastTriggered: 1,
          avgDuration: {
            $divide: [
              {
                $subtract: [
                  { $max: '$timestamps' },
                  { $min: '$timestamps' }
                ]
              },
              { $subtract: ['$count', 1] }
            ]
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(events.map(event => ({
      ...event,
      avgDuration: event.avgDuration / 1000, // 转换为秒
      lastTriggered: event.lastTriggered.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching event analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const trackRouter = router; 