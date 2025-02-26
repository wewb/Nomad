import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const validateCreateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (role && !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  next();
};

export const validateEventData = (req: Request, res: Response, next: NextFunction) => {
  const { projectId, eventName } = req.body;
  if (!projectId || !eventName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
}; 