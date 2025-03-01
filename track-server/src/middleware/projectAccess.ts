import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User';

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 管理员有所有权限
    if (user.role === UserRole.ADMIN) {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 检查用户是否有权限访问特定路由
export const restrictToAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}; 