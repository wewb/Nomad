"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProjectAccess = exports.adminOnly = exports.auth = void 0;
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error('No token provided');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User_1.User.findOne({
            _id: new mongoose_1.default.Types.ObjectId(decoded._id),
            isActive: true
        }).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};
exports.auth = auth;
const adminOnly = async (req, res, next) => {
    if (!req.user || req.user.role !== User_1.UserRole.ADMIN) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.adminOnly = adminOnly;
const checkProjectAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Please authenticate' });
    }
    if (req.user.role === User_1.UserRole.ADMIN) {
        return next();
    }
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId || !req.user.accessibleProjects.includes(projectId)) {
        return res.status(403).json({ error: 'No access to this project' });
    }
    next();
};
exports.checkProjectAccess = checkProjectAccess;
