"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = require("../models/Project");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function initTestApp() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-system');
        // 检查是否已存在
        const existing = await Project_1.Project.findOne({ projectId: 'test-project' });
        if (existing) {
            console.log('Test project already exists');
            return;
        }
        // 创建测试应用
        const testApp = new Project_1.Project({
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
    }
    catch (error) {
        console.error('Failed to initialize test project:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
initTestApp();
