import express from 'express';
import { apiAuth, apiAdminOnly, apiCheckProjectAccess } from '../middleware/apiAuth';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Event } from '../models/Event';

const router = express.Router();

// Define rate limiter: maximum of 100 requests per 15 minutes
const appRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

// 测试路由 - 不需要认证
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// 获取用户列表 (仅管理员)
router.get('/users/list', appRateLimiter, apiAuth, apiAdminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password -apiKey');
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 获取应用列表 (根据用户权限)
router.get('/app/list', apiAuth, async (req, res) => {
  try {
    const user = req.user;
    let projects;

    if (user?.role === 'admin') {
      projects = await Project.find();
    } else {
      projects = await Project.find({
        projectId: { $in: user?.accessibleProjects || [] }
      });
    }

    const formattedProjects = projects.map(project => ({
      id: project._id,
      projectId: project.projectId,
      name: project.name,
      description: project.description,
      endpointCount: project.endpoints.length,
      createdAt: project.createdAt
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 获取单个应用详情 (根据用户权限)
router.get('/app/:id', appRateLimiter, apiAuth, apiCheckProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const eventCount = await Event.countDocuments({ projectId: project.projectId });
    const events = await Event.find({ projectId: project.projectId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      id: project._id,
      projectId: project.projectId,
      name: project.name,
      description: project.description,
      endpoints: project.endpoints || [],
      eventCount,
      recentEvents: events,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// 获取应用事件列表 (根据用户权限)
router.get('/app/:id/events', apiAuth, apiCheckProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 分页参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // 查询事件
    const events = await Event.find({ projectId: project.projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 获取总数
    const total = await Event.countDocuments({ projectId: project.projectId });

    res.json({
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export const apiRouter = router;