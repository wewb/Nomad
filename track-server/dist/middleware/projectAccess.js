"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictToAdmin = exports.checkProjectAccess = void 0;
const User_1 = require("../models/User");
const checkProjectAccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 管理员有所有权限
        if (user.role === User_1.UserRole.ADMIN) {
            return next();
        }
        // 普通用户只能访问被分配的项目
        const projectId = req.query.projectId || req.body.projectId;
        if (!projectId) {
            return next();
        }
        if (!user.accessibleProjects.includes(projectId)) {
            return res.status(403).json({ error: 'No access to this project' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkProjectAccess = checkProjectAccess;
// 检查用户是否有权限访问特定路由
const restrictToAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== User_1.UserRole.ADMIN) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.restrictToAdmin = restrictToAdmin;
