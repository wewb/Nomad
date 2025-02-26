import { Request, Response, NextFunction } from 'express';
import { User, UserRole, IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { _id: string };
    const user = await User.findOne({ 
      _id: new mongoose.Types.ObjectId(decoded._id), 
      isActive: true 
    }).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId || !req.user.accessibleProjects.includes(projectId)) {
    return res.status(403).json({ error: 'No access to this project' });
  }
  
  next();
}; 