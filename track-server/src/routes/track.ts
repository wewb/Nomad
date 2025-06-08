import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Event } from '../models/Event';
import { Session } from '../models/Session';
import geoip from 'geoip-lite';
import { Project } from '../models/Project';
import { auth } from '../middleware/auth';
import { checkProjectAccess, restrictToAdmin } from '../middleware/projectAccess';
import { UserDocument, UserRole } from '../models/User';

const router = express.Router();
const lastPageViewTime: Record<string, number> = {};  // 存储每个项目的最后页面访问时间
const DEBOUNCE_TIME = 500;  // 防抖时间 500ms

// 验证端点权限的中间件
async function validateEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.body;
    
    // Validate projectId
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(projectId)) {
      console.log('Invalid projectId:', projectId);
      return res.status(400).json({ error: 'Invalid projectId' });
    }
    const referer = req.headers.referer || req.headers.origin;
    
    if (!referer) {
      console.log('Missing referer/origin header');
      return res.status(403).json({ error: 'Missing origin information' });
    }

    // 查找项目及其授权端点
    const project = await Project.findOne({ projectId: { $eq: projectId } }).populate('endpoints');
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

// 接收事件数据 - 支持单个事件和批量事件
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // 检查是否为批量请求（数组）
    const isArray = Array.isArray(data);
    const events = isArray ? data : [data];
    
    // 处理每个事件
    const savedEvents = await Promise.all(events.map(async (event) => {
      const { projectId, type, data: eventDetails, userEnvInfo } = event;
      
      // 获取客户端 IP
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      // 使用 geoip-lite 获取位置信息
      const geo = ip ? geoip.lookup(String(ip).split(',')[0]) : null;
      
      // 合并用户环境信息和位置信息
      const enrichedUserEnvInfo = {
        ...userEnvInfo,
        ipAddress: ip,
        location: geo ? {
          country: geo.country,
          region: geo.region,
          city: geo.city
        } : undefined
      };

      // 构建事件数据结构
      const newEventData = {
        projectId,
        type,
        data: {
          ...eventDetails,
          timestamp: Date.now(),
          events: eventDetails.events || []
        },
        userEnvInfo: enrichedUserEnvInfo
      };
      
      // 创建事件记录
      const eventModel = new Event(newEventData);
      return await eventModel.save();
    }));
    
    res.status(201).json({ 
      message: `${savedEvents.length} event(s) recorded successfully`,
      events: savedEvents.map(e => e._id)
    });
  } catch (error) {
    console.error('Failed to record events:', error);
    res.status(400).json({ error: 'Failed to record events' });
  }
});

// 获取统计数据
// Rate limiter for the /stats route
const statsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests to /stats, please try again later.' },
});

router.get('/stats', statsRateLimiter, async (req: Request, res: Response) => {
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
// Rate limiter for the /list route
const listRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests to /list, please try again later.' },
});

router.get('/list', auth, listRateLimiter, async (req, res) => {
  try {
    const user = req.user;
    const query: any = {};

    // 非管理员只能查看有权限的项目事件
    if (user?.role !== 'admin') {
      query.projectId = { $in: user?.accessibleProjects || [] };
    }

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 删除事件
const deleteRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many delete requests, please try again later.' },
});

router.delete('/:id', deleteRateLimiter, auth, restrictToAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // 如果是普通用户，检查是否有权限访问该事件所属的项目
    if (req.user?.role !== 'admin') {
      const projectIds = req.user?.accessibleProjects?.map((id: any) => id.toString()) || [];
      if (!projectIds.includes(event.projectId.toString())) {
        return res.status(403).json({ error: 'No permission to delete this event' });
      }
    }

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
const statsTotalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

router.get('/stats/total', auth, statsTotalLimiter, async (req, res) => {
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

// 获取单个事件详情
// Rate limiter for the /stats/:id route
const statsIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

router.get('/:id', statsIdLimiter, auth, async (req, res) => {
  try {
    // 确保不是 'list' 路径
    if (req.params.id === 'list') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Rate limiter for the /stats/errors route
const statsErrorsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

router.get('/stats/errors', statsErrorsLimiter, auth, async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as UserDocument;
    const query: any = {
      type: 'error_event'
    };
    
    // 非管理员只能查看有权限的项目
    if (user.role !== UserRole.ADMIN) {
      query.projectId = { $in: user.accessibleProjects || [] };
    }
    
    // 查询错误总数
    const totalErrors = await Event.countDocuments(query);
    
    // 按项目分组统计错误数
    const errorsByProject = await Event.aggregate([
      { $match: query },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    
    // 按错误类型分组统计
    const errorsByType = await Event.aggregate([
      { $match: query },
      { $group: { _id: '$data.type', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalErrors,
      errorsByProject,
      errorsByType
    });
  } catch (error) {
    console.error('Failed to fetch error stats:', error);
    res.status(500).json({ error: 'Failed to fetch error stats' });
  }
});

export const trackRouter = router; 