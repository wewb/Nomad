"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const apiAuth_1 = require("../middleware/apiAuth");
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const Event_1 = require("../models/Event");
const router = express_1.default.Router();
// 测试路由 - 不需要认证
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});
// 获取用户列表 (仅管理员)
router.get('/users/list', apiAuth_1.apiAuth, apiAuth_1.apiAdminOnly, async (req, res) => {
    try {
        const users = await User_1.User.find().select('-password -apiKey');
        res.json(users);
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// 获取应用列表 (根据用户权限)
router.get('/app/list', apiAuth_1.apiAuth, async (req, res) => {
    try {
        const user = req.user;
        let projects;
        if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
            projects = await Project_1.Project.find();
        }
        else {
            projects = await Project_1.Project.find({
                projectId: { $in: (user === null || user === void 0 ? void 0 : user.accessibleProjects) || [] }
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
    }
    catch (error) {
        console.error('Failed to fetch projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// 获取单个应用详情 (根据用户权限)
router.get('/app/:id', apiAuth_1.apiAuth, apiAuth_1.apiCheckProjectAccess, async (req, res) => {
    try {
        const project = await Project_1.Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const eventCount = await Event_1.Event.countDocuments({ projectId: project.projectId });
        const events = await Event_1.Event.find({ projectId: project.projectId })
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
    }
    catch (error) {
        console.error('Failed to fetch project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
// 获取应用事件列表 (根据用户权限)
router.get('/app/:id/events', apiAuth_1.apiAuth, apiAuth_1.apiCheckProjectAccess, async (req, res) => {
    try {
        const project = await Project_1.Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // 查询事件
        const events = await Event_1.Event.find({ projectId: project.projectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // 获取总数
        const total = await Event_1.Event.countDocuments({ projectId: project.projectId });
        res.json({
            data: events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
exports.apiRouter = router;
