import express, { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Session } from '../models/Session';
import geoip from 'geoip-lite';
import { Project } from '../models/Project';

const router = express.Router();
const lastPageViewTime: Record<string, number> = {};  // 存储每个项目的最后页面访问时间
const DEBOUNCE_TIME = 500;  // 防抖时间 500ms

// 验证端点权限的中间件
async function validateEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.body;
    const referer = req.headers.referer || req.headers.origin;
    
    if (!referer) {
      console.log('Missing referer/origin header');
      return res.status(403).json({ error: 'Missing origin information' });
    }

    // 查找项目及其授权端点
    const project = await Project.findOne({ projectId }).populate('endpoints');
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Validating endpoint:', {
      referer,
      projectId,
      endpoints: project.endpoints.map(e => e.url)
    });

    // 验证请求来源是否为授权端点
    const refererUrl = new URL(referer);
    const isAuthorizedEndpoint = project.endpoints.some(endpoint => {
      try {
        const endpointUrl = new URL(endpoint.url);
        // 验证 origin 和路径前缀
        const originMatch = refererUrl.origin === endpointUrl.origin;
        const basePath = endpointUrl.pathname.split('/').slice(0, -1).join('/');
        const pathMatch = refererUrl.pathname === '/' || 
                         refererUrl.pathname.startsWith(basePath);
        
        console.log('URL matching:', {
          refererPath: refererUrl.pathname,
          endpointPath: endpointUrl.pathname,
          basePath,
          originMatch,
          pathMatch
        });

        return originMatch && pathMatch;
      } catch (e) {
        console.error('Invalid endpoint URL:', endpoint.url);
        return false;
      }
    });

    if (!isAuthorizedEndpoint) {
      console.log('Unauthorized endpoint:', referer, 'for project:', projectId);
      return res.status(403).json({ 
        error: 'Unauthorized endpoint',
        message: `${referer} is not an authorized endpoint for project ${projectId}`
      });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('Endpoint validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 验证请求来源
const validateReferer = async (referer: string, projectId: string) => {
  const project = await Project.findOne({ projectId });
  if (!project) {
    throw new Error('Project not found');
  }

  const refererUrl = new URL(referer);
  const origin = refererUrl.origin;

  // 简单验证 origin 是否合法
  if (!['http://localhost:5173', 'http://localhost:3000'].includes(origin)) {
    throw new Error('Invalid referer origin');
  }

  return project;
};

// 记录事件
router.post('/', validateEndpoint, async (req: Request, res: Response) => {
  try {
    console.log('Track event:', {
      type: req.body.type,
      projectId: req.project?.projectId,
      referer: req.headers.referer,
      events: req.body.data?.events?.length || 0
    });

    const { type, data, userEnvInfo } = req.body;
    const projectId = req.project?.projectId;

    const event = new Event({
      projectId,
      type,
      data,
      userEnvInfo
    });

    await event.save();
    console.log('Event saved:', event._id);
    res.status(201).json(event);
  } catch (error) {
    console.error('Failed to save event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// 获取统计数据
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Stats request:', { startDate, endDate });

    // 构造查询条件
    const query = {
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };

    console.log('MongoDB query:', query);

    // 获取时间范围内的所有事件
    const events = await Event.find(query).sort({ createdAt: 1 });

    // 统计数据
    const stats = {
      events: events.map(event => ({
        ...event.toObject(),
        _id: event._id.toString()
      })),
      // 基础统计
      totalEvents: events.length,
      uniqueUsers: new Set(events.map(e => e.userEnvInfo?.uid)).size,
      // 事件类型统计
      eventTypes: events.reduce((acc: any, event) => {
        if (event.data?.events) {
          event.data.events.forEach((e: any) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
          });
        }
        return acc;
      }, {}),
      // 浏览器统计
      browsers: events.reduce((acc: any, event) => {
        const browser = event.userEnvInfo?.browserName;
        if (browser) {
          acc[browser] = (acc[browser] || 0) + 1;
        }
        return acc;
      }, {}),
      // 操作系统统计
      os: events.reduce((acc: any, event) => {
        const os = event.userEnvInfo?.osName;
        if (os) {
          acc[os] = (acc[os] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
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