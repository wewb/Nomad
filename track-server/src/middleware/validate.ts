import { Request, Response, NextFunction } from 'express';

export const validateEventData = (req: Request, res: Response, next: NextFunction) => {
  const { projectId, eventName } = req.body;
  if (!projectId || !eventName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
}; 