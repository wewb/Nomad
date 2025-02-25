import express, { Request, Response } from 'express';
import { Project } from '../models/Project';

const router = express.Router();

// 获取应用列表
router.get('/list', async (req: Request, res: Response) => {
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

// 获取应用详情
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      id: project._id,
      projectId: project.projectId,
      name: project.name,
      description: project.description,
      endpoints: project.endpoints.map(endpoint => ({
        id: endpoint._id,
        url: endpoint.url,
        name: endpoint.name,
        description: endpoint.description,
        createdAt: endpoint.createdAt
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// 创建新应用
router.post('/', async (req: Request, res: Response) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// 删除应用
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Failed to delete application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// 更新应用信息
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(project);
  } catch (error) {
    console.error('Failed to update application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// 添加端点
router.post('/:id/endpoints', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.endpoints.push(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to add endpoint:', error);
    res.status(500).json({ error: 'Failed to add endpoint' });
  }
});

// 删除端点
router.delete('/:id/endpoints/:endpointId', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 使用 mongoose 的 pull 操作符来删除端点
    await Project.findByIdAndUpdate(req.params.id, {
      $pull: {
        endpoints: { _id: req.params.endpointId }
      }
    });

    res.json({ message: 'Endpoint deleted successfully' });
  } catch (error) {
    console.error('Failed to delete endpoint:', error);
    res.status(500).json({ error: 'Failed to delete endpoint' });
  }
});

export const applicationRouter = router; 