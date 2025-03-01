import express, { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Event } from '../models/Event';
import { auth, adminOnly } from '../middleware/auth';
import { checkProjectAccess, restrictToAdmin } from '../middleware/projectAccess';

const router = express.Router();

// 获取应用列表
router.get('/list', auth, async (req: Request, res: Response) => {
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

// 获取单个应用详情
router.get('/:id', auth, async (req: Request, res: Response) => {
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

// 创建新应用
router.post('/', auth, restrictToAdmin, async (req, res) => {
  try {
    const { projectId, name, description, endpoints } = req.body;

    // 检查 projectId 是否已存在
    const existingProject = await Project.findOne({ projectId });
    if (existingProject) {
      return res.status(400).json({ error: 'Project ID already exists' });
    }

    const project = new Project({
      projectId,
      name,
      description,
      endpoints: endpoints || [],
      createdBy: req.user?._id
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(400).json({ error: 'Failed to create project' });
  }
});

// 更新应用
router.put('/:id', auth, restrictToAdmin, async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        name: req.body.name,
        description: req.body.description
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(400).json({ error: 'Failed to update project' });
  }
});

// 删除应用
router.delete('/:id', auth, restrictToAdmin, async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 同时删除相关的事件数据
    await Event.deleteMany({ projectId: project.projectId });
    
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 添加端点 - 使用一个统一的处理器
router.post('/:id/endpoints', auth, async (req, res) => {
  try {
    console.log('Adding endpoint to app:', req.params.id, req.body);
    const app = await Project.findById(req.params.id);
    
    if (!app) {
      console.log('Application not found');
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // 验证请求数据
    const { name, url, description } = req.body;
    
    if (!name || !url) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    
    // 创建新端点
    const newEndpoint = {
      name,
      url,
      description: description || '',
      createdAt: new Date()
    };
    
    // 确保 endpoints 数组存在，但不直接赋值
    if (!app.endpoints || app.endpoints.length === 0) {
      // 使用 Mongoose 的方法初始化数组
      app.markModified('endpoints');
    }
    
    // 添加到应用的端点列表
    app.endpoints.push(newEndpoint);
    await app.save();
    
    console.log('Endpoint added successfully');
    res.status(201).json({ 
      message: 'Endpoint added successfully',
      endpoint: app.endpoints[app.endpoints.length - 1] 
    });
  } catch (error) {
    console.error('Failed to add endpoint:', error);
    res.status(500).json({ error: 'Failed to add endpoint' });
  }
});

// 删除端点
router.delete('/:id/endpoints/:endpointId', auth, async (req, res) => {
  try {
    console.log('Deleting endpoint:', req.params.id, req.params.endpointId);
    const app = await Project.findById(req.params.id);
    
    if (!app) {
      console.log('Application not found');
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // 确保 endpoints 数组存在
    if (!app.endpoints) {
      console.log('No endpoints found');
      return res.status(404).json({ error: 'No endpoints found' });
    }
    
    // 查找端点索引
    const endpointIndex = app.endpoints.findIndex(
      endpoint => endpoint._id.toString() === req.params.endpointId
    );
    
    if (endpointIndex === -1) {
      console.log('Endpoint not found');
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    // 删除端点
    app.endpoints.splice(endpointIndex, 1);
    await app.save();
    
    console.log('Endpoint deleted successfully');
    res.json({ message: 'Endpoint deleted successfully' });
  } catch (error) {
    console.error('Failed to delete endpoint:', error);
    res.status(500).json({ error: 'Failed to delete endpoint' });
  }
});

export const applicationRouter = router; 