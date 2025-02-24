import express from 'express';
import { Project } from '../models/Project';

const router = express.Router();

// 获取所有应用
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// 创建新应用
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// 删除应用
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export const appRouter = router; 