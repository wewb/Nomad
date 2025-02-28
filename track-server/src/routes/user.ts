import express from 'express';
import { User, UserRole } from '../models/User';
import { auth, adminOnly } from '../middleware/auth';
import { validateCreateUser } from '../middleware/validate';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const router = express.Router();

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
    const user = await User.findOne({ email, isActive: true });
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword);

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
router.get('/', auth, adminOnly, async (req, res) => {
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
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
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
router.post('/:id/api-key', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const apiKey = user.generateApiKey();
    await user.save();
    
    res.json({ apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// 配置用户可读项目
router.put('/:id/projects', auth, adminOnly, async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot configure projects for admin users' });
    }

    // 确保 projectIds 是有效的数组
    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ error: 'Invalid project IDs format' });
    }

    // 过滤掉无效的值
    user.accessibleProjects = projectIds.filter(id => id && typeof id === 'string');
    await user.save();

    res.json({ message: 'Projects updated successfully' });
  } catch (error) {
    console.error('Failed to update user projects:', error);
    res.status(500).json({ error: 'Failed to update user projects' });
  }
});

export default router; 