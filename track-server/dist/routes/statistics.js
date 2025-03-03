"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const projectAccess_1 = require("../middleware/projectAccess");
const StatisticsService_1 = require("../services/StatisticsService");
const router = express_1.default.Router();
// 获取基础统计指标
router.get('/:projectId/basic', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;
        const metrics = await StatisticsService_1.StatisticsService.getBasicMetrics(projectId, new Date(startDate), new Date(endDate));
        res.json(metrics);
    }
    catch (error) {
        console.error('Failed to get basic metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});
// 获取环境统计
router.get('/:projectId/environment', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;
        const metrics = await StatisticsService_1.StatisticsService.getEnvironmentMetrics(projectId, new Date(startDate), new Date(endDate));
        res.json(metrics);
    }
    catch (error) {
        console.error('Failed to get environment metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});
// 获取行为统计
router.get('/:projectId/behavior', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;
        const metrics = await StatisticsService_1.StatisticsService.getBehaviorMetrics(projectId, new Date(startDate), new Date(endDate));
        res.json(metrics);
    }
    catch (error) {
        console.error('Failed to get behavior metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});
// 获取时间维度分析
router.get('/:projectId/time', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate, interval } = req.query;
        const metrics = await StatisticsService_1.StatisticsService.getTimeMetrics(projectId, new Date(startDate), new Date(endDate), interval);
        res.json(metrics);
    }
    catch (error) {
        console.error('Failed to get time metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});
// 获取用户路径分析
router.get('/:projectId/path', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;
        const analysis = await StatisticsService_1.StatisticsService.getPathAnalysis(projectId, new Date(startDate), new Date(endDate));
        res.json(analysis);
    }
    catch (error) {
        console.error('Failed to get path analysis:', error);
        res.status(500).json({ error: 'Failed to get analysis' });
    }
});
// 获取转化漏斗分析
router.post('/:projectId/funnel', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate, steps } = req.body;
        if (!Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ error: 'Invalid funnel steps' });
        }
        const analysis = await StatisticsService_1.StatisticsService.getFunnelAnalysis(projectId, new Date(startDate), new Date(endDate), steps);
        res.json(analysis);
    }
    catch (error) {
        console.error('Failed to get funnel analysis:', error);
        res.status(500).json({ error: 'Failed to get analysis' });
    }
});
// 获取事件分析数据
router.get('/:projectId/events', auth_1.auth, projectAccess_1.checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        const analysis = await StatisticsService_1.StatisticsService.getEventAnalysis(projectId, startDate, endDate);
        res.json(analysis);
    }
    catch (error) {
        console.error('Failed to fetch event analysis:', error);
        res.status(500).json({ error: 'Failed to fetch event analysis' });
    }
});
exports.statisticsRouter = router;
