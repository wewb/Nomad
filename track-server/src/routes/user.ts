import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { User, UserRole } from '../models/User';
import mongoose from 'mongoose';
import { ApiKey } from '../models/ApiKey';

import { auth, adminOnly } from '../middleware/auth';
import { validateCreateUser } from '../middleware/validate';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = express.Router();

// Rate limiter for user status update route
const updateUserStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

// Rate limiter: maximum of 100 requests per 15 minutes
const meRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

// 用户登录
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
});

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 验证 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      console.log('Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 查找用户
    const user = await User.findOne({ email: { $eq: email }, isActive: true });
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
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回用户信息（不包含密码）
    const userObject = user.toObject();
    const { password: _, ...userWithoutPassword } = userObject;

    console.log('Login successful');
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 获取用户列表 (仅管理员)
const getUsersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

router.get('/', getUsersLimiter, auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 创建用户
router.post('/', auth, adminOnly, validateCreateUser, async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    const user = new User({
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
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create user' });
  }
});

// 更新用户状态 (仅管理员)
router.patch('/:id/status', updateUserStatusLimiter, auth, adminOnly, async (req, res) => {
  try {
    // Validate that isActive is a boolean
    const isActive = req.body.isActive;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Invalid value for isActive' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: { $eq: isActive } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user status' });
  }
});

// 生成 API Key
const getKeyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.get('/key', getKeyLimiter, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id);
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
  } catch (error) {
    console.error('Failed to fetch user API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

// 创建新的API密钥 (如果已存在则替换)
const postKeyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/key', postKeyLimiter, auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // 查找用户
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 创建新密钥
    const key = crypto.randomBytes(32).toString('hex');
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
  } catch (error) {
    console.error('Failed to create API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// 删除API密钥
router.delete('/key', auth, meRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id);
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
  } catch (error) {
    console.error('Failed to delete API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// 配置用户项目权限
router.post('/projects', auth, meRateLimiter, adminOnly, async (req: Request, res: Response) => {
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

    // 验证 userId 是否为有效的 ObjectId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    // 查找用户
    const user = await User.findOne({ _id: { $eq: userId } });
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

  } catch (error) {
    console.error('Error updating user projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取当前用户信息
router.get('/me', auth, meRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router; 