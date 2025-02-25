import { Project } from '../models/Project';

declare global {
  namespace Express {
    interface Request {
      project?: Project;
    }
  }
} 