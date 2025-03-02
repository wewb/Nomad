"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationRouter = void 0;
const express_1 = __importDefault(require("express"));
const Project_1 = require("../models/Project");
const Event_1 = require("../models/Event");
const auth_1 = require("../middleware/auth");
const projectAccess_1 = require("../middleware/projectAccess");
const User_1 = require("../models/User");
const mongoose = require("mongoose");
const router = express_1.default.Router();
// 获取应用列表
router.get('/list', auth_1.auth, async (req, res) => {
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
// 获取单个应用详情
router.get('/:id', auth_1.auth, async (req, res) => {
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
// 创建新应用
router.post('/', auth_1.auth, projectAccess_1.restrictToAdmin, async (req, res) => {
    var _a;
    try {
        const { projectId, name, description, endpoints } = req.body;
        // 检查 projectId 是否已存在
        const existingProject = await Project_1.Project.findOne({ projectId });
        if (existingProject) {
            return res.status(400).json({ error: 'Project ID already exists' });
        }
        const project = new Project_1.Project({
            projectId,
            name,
            description,
            endpoints: endpoints || [],
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        await project.save();
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Failed to create project:', error);
        res.status(400).json({ error: 'Failed to create project' });
    }
});
// 更新应用
router.put('/:id', auth_1.auth, projectAccess_1.restrictToAdmin, async (req, res) => {
    try {
        const project = await Project_1.Project.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            description: req.body.description
        }, { new: true });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Failed to update project:', error);
        res.status(400).json({ error: 'Failed to update project' });
    }
});
// 删除应用
router.delete('/:id', auth_1.auth, projectAccess_1.restrictToAdmin, async (req, res) => {
    try {
        const project = await Project_1.Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // 同时删除相关的事件数据
        await Event_1.Event.deleteMany({ projectId: project.projectId });
        res.status(204).send();
    }
    catch (error) {
        console.error('Failed to delete project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
// 添加端点 - 使用嵌入式文档方式
router.post('/:id/endpoints', auth_1.auth, async (req, res) => {
  try {
    console.log('Adding endpoint to app:', req.params.id, req.body);
    const app = await Project_1.Project.findById(req.params.id);
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
    
    // 确保 endpoints 数组存在
    if (!app.endpoints) {
      app.endpoints = [];
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
router.delete('/:id/endpoints/:endpointId', auth_1.auth, async (req, res) => {
    try {
        console.log('Deleting endpoint:', req.params.id, req.params.endpointId);
        const app = await Project_1.Project.findById(req.params.id);
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
        const endpointIndex = app.endpoints.findIndex(endpoint => endpoint._id.toString() === req.params.endpointId);
        if (endpointIndex === -1) {
            console.log('Endpoint not found');
            return res.status(404).json({ error: 'Endpoint not found' });
        }
        // 删除端点
        app.endpoints.splice(endpointIndex, 1);
        await app.save();
        console.log('Endpoint deleted successfully');
        res.json({ message: 'Endpoint deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete endpoint:', error);
        res.status(500).json({ error: 'Failed to delete endpoint' });
    }
});
exports.applicationRouter = router;
