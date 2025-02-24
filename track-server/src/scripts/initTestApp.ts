import mongoose from 'mongoose';
import { Project } from '../models/Project';
import dotenv from 'dotenv';

dotenv.config();

async function initTestApp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-system');
    
    // 检查是否已存在
    const existing = await Project.findOne({ projectId: 'test-project' });
    if (existing) {
      console.log('Test project already exists');
      return;
    }

    // 创建测试应用
    const testApp = new Project({
      projectId: 'test-project',
      name: 'Test Application',
      description: 'Application for SDK testing',
      endpoints: [{
        url: 'http://127.0.0.1:8080/test/test.html',
        name: 'Test Page',
        description: 'SDK test page with various tracking events'
      }]
    });

    await testApp.save();
    console.log('Test project initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test project:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initTestApp(); 