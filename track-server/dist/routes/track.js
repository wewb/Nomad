"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackRouter = void 0;
const express_1 = __importDefault(require("express"));
const Event_1 = require("../models/Event");
const Project_1 = require("../models/Project");
const auth_1 = require("../middleware/auth");
const projectAccess_1 = require("../middleware/projectAccess");
const router = express_1.default.Router();
const lastPageViewTime = {}; // 存储每个项目的最后页面访问时间
const DEBOUNCE_TIME = 500; // 防抖时间 500ms
// 验证端点权限的中间件
async function validateEndpoint(req, res, next) {
    try {
        const { projectId } = req.body;
        const referer = req.headers.referer || req.headers.origin;
        if (!referer) {
            console.log('Missing referer/origin header');
            return res.status(403).json({ error: 'Missing origin information' });
        }
        // 查找项目及其授权端点
        const project = await Project_1.Project.findOne({ projectId }).populate('endpoints');
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
            }
            catch (e) {
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
    }
    catch (error) {
        console.error('Endpoint validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// 验证请求来源
const validateReferer = async (referer, projectId) => {
    const project = await Project_1.Project.findOne({ projectId });
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
// 记录事件
router.post('/', validateEndpoint, async (req, res) => {
    var _a, _b, _c, _d;
    try {
        console.log('Track event:', {
            type: req.body.type,
            projectId: (_a = req.project) === null || _a === void 0 ? void 0 : _a.projectId,
            referer: req.headers.referer,
            events: ((_c = (_b = req.body.data) === null || _b === void 0 ? void 0 : _b.events) === null || _c === void 0 ? void 0 : _c.length) || 0
        });
        const { type, data, userEnvInfo } = req.body;
        const projectId = (_d = req.project) === null || _d === void 0 ? void 0 : _d.projectId;
        const event = new Event_1.Event({
            projectId,
            type,
            data,
            userEnvInfo
        });
        await event.save();
        console.log('Event saved:', event._id);
        res.status(201).json(event);
    }
    catch (error) {
        console.error('Failed to save event:', error);
        res.status(500).json({ error: 'Failed to save event' });
    }
});
// 获取统计数据
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Stats request:', { startDate, endDate });
        // 构造查询条件
        const query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        console.log('MongoDB query:', query);
        // 获取时间范围内的所有事件
        const events = await Event_1.Event.find(query).sort({ createdAt: 1 });
        // 统计数据
        const stats = {
            events: events.map(event => ({
                ...event.toObject(),
                _id: event._id.toString()
            })),
            // 基础统计
            totalEvents: events.length,
            uniqueUsers: new Set(events.map(e => { var _a; return (_a = e.userEnvInfo) === null || _a === void 0 ? void 0 : _a.uid; })).size,
            // 事件类型统计
            eventTypes: events.reduce((acc, event) => {
                var _a;
                if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.events) {
                    event.data.events.forEach((e) => {
                        acc[e.type] = (acc[e.type] || 0) + 1;
                    });
                }
                return acc;
            }, {}),
            // 浏览器统计
            browsers: events.reduce((acc, event) => {
                var _a;
                const browser = (_a = event.userEnvInfo) === null || _a === void 0 ? void 0 : _a.browserName;
                if (browser) {
                    acc[browser] = (acc[browser] || 0) + 1;
                }
                return acc;
            }, {}),
            // 操作系统统计
            os: events.reduce((acc, event) => {
                var _a;
                const os = (_a = event.userEnvInfo) === null || _a === void 0 ? void 0 : _a.osName;
                if (os) {
                    acc[os] = (acc[os] || 0) + 1;
                }
                return acc;
            }, {})
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Failed to get stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});
// 获取事件列表
router.get('/list', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        const query = {};
        // 非管理员只能查看有权限的项目事件
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'admin') {
            query.projectId = { $in: (user === null || user === void 0 ? void 0 : user.accessibleProjects) || [] };
        }
        const events = await Event_1.Event.find(query)
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
// 删除事件
router.delete('/:id', auth_1.auth, projectAccess_1.restrictToAdmin, async (req, res) => {
    var _a, _b, _c;
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // 如果是普通用户，检查是否有权限访问该事件所属的项目
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            const projectIds = ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.accessibleProjects) === null || _c === void 0 ? void 0 : _c.map((id) => id.toString())) || [];
            if (!projectIds.includes(event.projectId.toString())) {
                return res.status(403).json({ error: 'No permission to delete this event' });
            }
        }
        await Event_1.Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 获取事件分析数据
router.get('/analysis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const events = await Event_1.Event.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
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
    }
    catch (error) {
        console.error('Error fetching event analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 获取总体统计数据
router.get('/stats/total', async (req, res) => {
    try {
        const totalEvents = await Event_1.Event.countDocuments();
        const uniqueUsers = await Event_1.Event.distinct('userEnvInfo.uid').then(uids => uids.length);
        res.json({
            totalEvents,
            uniqueUsers,
        });
    }
    catch (error) {
        console.error('Failed to get total stats:', error);
        res.status(500).json({ error: 'Failed to get total stats' });
    }
});
// 获取单个事件详情
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        // 确保不是 'list' 路径
        if (req.params.id === 'list') {
            return res.status(400).json({ error: 'Invalid event ID' });
        }
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    }
    catch (error) {
        console.error('Failed to fetch event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
// 获取错误统计数据
router.get('/stats/errors', async (req, res) => {
    try {
        // 简化版本，不做权限检查，先确保路由能被访问
        const query = {
            type: 'error_event'
        };
        
        // 查询错误总数
        const totalErrors = await Event_1.Event.countDocuments(query);
        
        // 按项目分组统计错误数
        const errorsByProject = await Event_1.Event.aggregate([
            { $match: query },
            { $group: { _id: '$projectId', count: { $sum: 1 } } }
        ]);
        
        // 按错误类型分组统计
        const errorsByType = await Event_1.Event.aggregate([
            { $match: query },
            { $group: { _id: '$data.type', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalErrors,
            errorsByProject,
            errorsByType,
            // message: 'This is the updated route'  // 添加这个消息确认是新代码
        });
    } catch (error) {
        console.error('Failed to fetch error stats:', error);
        res.status(500).json({ error: 'Failed to fetch error stats' });
    }
});
exports.trackRouter = router;
