"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiCheckProjectAccess = exports.apiAdminOnly = exports.apiAuth = void 0;
const User_1 = require("../models/User");
// API 密钥认证中间件
const apiAuth = async (req, res, next) => {
    try {
        // 从查询参数中获取 API 密钥
        const apiKey = req.query.key;
        if (!apiKey) {
            return res.status(401).json({ error: 'API key is required' });
        }
        console.log('Authenticating with API key:', apiKey); // 添加调试日志
        // 查找拥有该 API 密钥的用户
        const user = await User_1.User.findOne({ apiKey });
        console.log('User found:', user ? 'yes' : 'no'); // 添加调试日志
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        // 将用户信息附加到请求对象
        req.user = user;
        next();
    }
    catch (error) {
        console.error('API authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.apiAuth = apiAuth;
// 管理员 API 密钥认证中间件
const apiAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ error: 'Admin access required' });
    }
};
exports.apiAdminOnly = apiAdminOnly;
// 项目访问权限检查中间件
const apiCheckProjectAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // 管理员可以访问所有项目
        if (req.user.role === 'admin') {
            return next();
        }
        const projectId = req.params.id;
        // 检查用户是否有权限访问该项目
        const hasAccess = req.user.accessibleProjects.some(id => id.toString() === projectId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        next();
    }
    catch (error) {
        console.error('Project access check error:', error);
        res.status(500).json({ error: 'Access check failed' });
    }
};
exports.apiCheckProjectAccess = apiCheckProjectAccess;
