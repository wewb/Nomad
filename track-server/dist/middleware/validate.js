"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEventData = exports.validateCreateUser = void 0;
const User_1 = require("../models/User");
const validateCreateUser = async (req, res, next) => {
    const { email, password, role } = req.body.fields || req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    if (req.body.fields) {
        req.body = req.body.fields;
    }
    const existingUser = await User_1.User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    next();
};
exports.validateCreateUser = validateCreateUser;
const validateEventData = (req, res, next) => {
    const { projectId, eventName } = req.body;
    if (!projectId || !eventName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    next();
};
exports.validateEventData = validateEventData;
