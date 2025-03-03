import express from 'express';
import { auth } from '../middleware/auth';
import { checkProjectAccess } from '../middleware/projectAccess';
import { StatisticsService } from '../services/StatisticsService';

const router = express.Router();

// 获取基础统计指标
router.get('/:projectId/basic', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await StatisticsService.getBasicMetrics(
      projectId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get basic metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 获取环境统计
router.get('/:projectId/environment', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await StatisticsService.getEnvironmentMetrics(
      projectId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get environment metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 获取行为统计
router.get('/:projectId/behavior', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await StatisticsService.getBehaviorMetrics(
      projectId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get behavior metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 获取时间维度分析
router.get('/:projectId/time', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, interval } = req.query;

    const metrics = await StatisticsService.getTimeMetrics(
      projectId,
      new Date(startDate as string),
      new Date(endDate as string),
      interval as 'day' | 'week' | 'month'
    );

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get time metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 获取用户路径分析
router.get('/:projectId/path', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const analysis = await StatisticsService.getPathAnalysis(
      projectId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(analysis);
  } catch (error) {
    console.error('Failed to get path analysis:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

// 获取转化漏斗分析
router.post('/:projectId/funnel', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, steps } = req.body;

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Invalid funnel steps' });
    }

    const analysis = await StatisticsService.getFunnelAnalysis(
      projectId,
      new Date(startDate),
      new Date(endDate),
      steps
    );

    res.json(analysis);
  } catch (error) {
    console.error('Failed to get funnel analysis:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

// 获取事件分析数据
router.get('/:projectId/events', auth, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const analysis = await StatisticsService.getEventAnalysis(
      projectId,
      startDate,
      endDate
    );

    res.json(analysis);
  } catch (error) {
    console.error('Failed to fetch event analysis:', error);
    res.status(500).json({ error: 'Failed to fetch event analysis' });
  }
});

export const statisticsRouter = router; 