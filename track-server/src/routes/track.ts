import express from 'express';
import { Event } from '../models/Event';
import { Session } from '../models/Session';
import geoip from 'geoip-lite';
import { Project } from '../models/Project';

const router = express.Router();
const lastPageViewTime: Record<string, number> = {};  // 存储每个项目的最后页面访问时间
const DEBOUNCE_TIME = 500;  // 防抖时间 500ms

// 记录事件
router.post('/', async (req, res) => {
  try {
    const { type, data, userEnvInfo, projectId } = req.body;
    
    // 验证项目是否存在
    const project = await Project.findOne({ projectId });
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    // 添加调试日志
    console.log('Received request body:', JSON.stringify(req.body, null, 2));

    // 验证必要的数据字段
    if (!type || !data || !userEnvInfo || !projectId) {
      console.log('Missing required fields:', { type, data, userEnvInfo, projectId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证数据类型
    if (type !== 'session') {  // 现在我们只接受 session 类型
      console.log('Invalid event type:', type);
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // 验证会话数据的完整性
    if (!data.pageUrl || !data.events || !Array.isArray(data.events)) {
      console.log('Invalid session data:', data);
      return res.status(400).json({ error: 'Invalid session data' });
    }

    // 简化日志输出
    console.log(`Received session data for page: ${data.pageUrl}`);
    console.log(`Total events: ${data.events.length}`);
    console.log(`Events:`, data.events);

    // 添加 IP 和地理位置信息
    const ipAddress = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim();
    if (ipAddress) {
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        userEnvInfo.ipAddress = ipAddress;
        userEnvInfo.location = {
          country: geo.country,
          region: geo.region,
          city: geo.city
        };
      }
    }

    // 保存到数据库
    const event = new Event({
      type,
      data,
      userEnvInfo,
      projectId
    });

    await event.save();
    console.log(`Session saved successfully with ID: ${event._id}`);
    
    res.status(201).json({ message: 'Session recorded successfully' });
  } catch (error) {
    console.error('Failed to save session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Received date range:', { startDate, endDate });
    
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    console.log('MongoDB query:', query);

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

    console.log('Trend stats results:', trendStats);

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
      os: osStats,
      totalEvents: trendStats.reduce((sum, item) => sum + item.count, 0),
      uniqueUsers: await Event.distinct('userEnvInfo.uid', query).then(uids => uids.length)
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

// 获取总体统计数据
router.get('/stats/total', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const uniqueUsers = await Event.distinct('userEnvInfo.uid').then(uids => uids.length);

    res.json({
      totalEvents,
      uniqueUsers,
    });
  } catch (error) {
    console.error('Failed to get total stats:', error);
    res.status(500).json({ error: 'Failed to get total stats' });
  }
});

export const trackRouter = router; 