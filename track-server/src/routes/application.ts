import express from 'express';
import { Project } from '../models/Project';

const router = express.Router();

// 获取所有应用列表
router.get('/', async (req, res) => {
  try {
    const applications = await Project.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Failed to get applications:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// 创建新应用
router.post('/', async (req, res) => {
  try {
    const { name, description, projectId } = req.body;
    
    // 验证必要字段
    if (!name || !projectId) {
      return res.status(400).json({ error: 'Name and projectId are required' });
    }

    // 检查 projectId 是否已存在
    const existing = await Project.findOne({ projectId });
    if (existing) {
      return res.status(400).json({ error: 'ProjectId already exists' });
    }

    const application = new Project({
      name,
      description,
      projectId,
      endpoints: []
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Failed to create application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// 添加新端点
router.post('/:projectId/endpoints', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url, name, description } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const application = await Project.findOne({ projectId });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.endpoints.push({
      url,
      name,
      description
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Failed to add endpoint:', error);
    res.status(500).json({ error: 'Failed to add endpoint' });
  }
});

// 更新应用信息
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const application = await Project.findOneAndUpdate(
      { projectId },
      { name, description },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Failed to update application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// 删除应用
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const application = await Project.findOneAndDelete({ projectId });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Failed to delete application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export const applicationRouter = router; 