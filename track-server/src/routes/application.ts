import express, { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Event } from '../models/Event';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

// 获取应用列表
router.get('/list', auth, async (req: Request, res: Response) => {
  try {
    const projects = await Project.find();

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
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project' });
  }
});

// 更新应用
router.put('/:id', auth, adminOnly, async (req: Request, res: Response) => {
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
router.delete('/:id', auth, adminOnly, async (req: Request, res: Response) => {
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

export const applicationRouter = router; 