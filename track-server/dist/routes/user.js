"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// 用户登录
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;
        // 验证必填字段
        if (!email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // 查找用户
        const user = await User_1.User.findOne({ email, isActive: true });
        console.log('User found:', user ? 'yes' : 'no');
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // 验证密码
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            console.log('Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // 生成 token
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // 返回用户信息（不包含密码）
        const userObject = user.toObject();
        const { password: _, ...userWithoutPassword } = userObject;
        console.log('Login successful');
        res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// 获取用户列表 (仅管理员)
router.get('/', auth_1.auth, auth_1.adminOnly, async (req, res) => {
    try {
        const users = await User_1.User.find().select('-password');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// 创建用户
router.post('/', auth_1.auth, auth_1.adminOnly, validate_1.validateCreateUser, async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = new User_1.User({
            email,
            password, // 密码会在 User model 的 pre save 中自动加密
            role: role || 'user',
            isActive: true
        });
        await user.save();
        // 不返回密码字段
        const userResponse = {
            _id: user._id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        res.status(201).json(userResponse);
    }
    catch (error) {
        console.error('Failed to create user:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create user' });
    }
});
// 更新用户状态 (仅管理员)
router.patch('/:id/status', auth_1.auth, auth_1.adminOnly, async (req, res) => {
    try {
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update user status' });
    }
});
// 生成 API Key
router.get('/key', auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }
        // 返回格式化的API密钥数据
        res.json({
            data: {
                _id: user._id,
                key: user.apiKey,
                name: user.email, // 使用邮箱作为密钥名称
                userId: user._id
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch user API key:', error);
        res.status(500).json({ error: 'Failed to fetch API key' });
    }
});
// 创建新的API密钥 (如果已存在则替换)
router.post('/key', auth_1.auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        // 查找用户
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // 创建新密钥
        const key = crypto_1.default.randomBytes(32).toString('hex');
        user.apiKey = key;
        await user.save();
        // 返回格式化的API密钥数据
        res.status(201).json({
            data: {
                _id: user._id,
                key: user.apiKey,
                name: name,
                userId: user._id
            }
        });
    }
    catch (error) {
        console.error('Failed to create API key:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});
// 删除API密钥
router.delete('/key', auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }
        // 删除密钥
        user.apiKey = undefined;
        await user.save();
        res.json({ message: 'API key deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete API key:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});
// 配置用户项目权限
router.post('/projects', auth_1.auth, auth_1.adminOnly, async (req, res) => {
    try {
        console.log('Received request body:', req.body); // 调试日志
        const { userId, projectIds } = req.body;
        // 验证请求数据
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        if (!Array.isArray(projectIds)) {
            return res.status(400).json({ error: 'Project IDs must be an array' });
        }
        // 查找用户
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // 更新用户的可访问项目列表
        user.accessibleProjects = projectIds;
        await user.save();
        res.json({
            message: 'Projects updated successfully',
            accessibleProjects: user.accessibleProjects
        });
    }
    catch (error) {
        console.error('Error updating user projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 获取当前用户信息
router.get('/me', auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
exports.default = router;
