import { Project } from '../models/Project';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: mongoose.Types.ObjectId };
      project?: any;
    }
  }
} 